import { buildRegexSearchClauses, rankCatalogSearchResults, recordCatalogSearchTelemetry, shouldSuppressAutocomplete, tryAtlasCatalogSearch } from '@esparex/core/services';

import { Request, Response } from 'express';
import { Model, Document } from 'mongoose';
import { LISTING_TYPE_VALUES, type ListingTypeValue } from "@esparex/shared";
import {
    getPaginationParams,
    sendPaginatedResponse,
    sendSuccessResponse,
    sendAdminError
} from './adminBaseController';
import { getCache, setCache, CACHE_TTLS } from '@esparex/core/utils/redisCache';
import { FeatureFlag, isEnabled } from '@esparex/core/config/featureFlags';
import { getAdminConnection, getUserConnection } from '@esparex/core/config/db';
import {
    castCatalogQueryIds,
    recordCatalogReadDiff,
    runCatalogShadowRead,
    summarizeCatalogReadDiff
} from '@esparex/core/utils/catalogShadowRead';

import logger from '@esparex/core/utils/logger';

interface ContentOptions {
    searchFields?: string[];
    defaultSort?: Record<string, 1 | -1>;
    publicQuery?: Record<string, unknown>;
    adminQuery?: Record<string, unknown>;
    populate?: unknown;
    select?: string;
    transformResponse?: (items: unknown[]) => unknown | Promise<unknown>;
    queryParams?: Record<string, unknown>;
}

type CachedPaginatedPayload = Record<string, unknown> & {
    items?: unknown[];
    total?: number;
    page?: number;
    limit?: number;
};

const CATALOG_MODELS = ['Category', 'Brand', 'Model', 'ServiceType', 'ScreenSize', 'SparePart'];

const ensureAdminCatalogModel = <T extends Document>(model: Model<T>): Model<T> => {
    const adminConn = getAdminConnection();
    const userConn = getUserConnection();

    for (const modelName of CATALOG_MODELS) {
        const userModel = userConn.models[modelName] as Model<Document> | undefined;
        if (userModel && !adminConn.models[modelName]) {
            adminConn.model(modelName, userModel.schema, userModel.collection.name);
        }
    }

    return (adminConn.models[model.modelName] as Model<T> | undefined) ||
        adminConn.model<T>(model.modelName, model.schema, model.collection.name);
};

const readAdminCatalogPage = async (params: {
    model: Model<Document>;
    query: Record<string, unknown>;
    sort: Record<string, 1 | -1>;
    skip: number;
    limit: number;
    populate?: unknown;
    select?: string;
    includeDeleted?: boolean;
}) => {
    const adminModel = ensureAdminCatalogModel(params.model);
    const adminQuery = castCatalogQueryIds(params.query) as Record<string, unknown>;
    const findQuery = adminModel.find(adminQuery).skip(params.skip).limit(params.limit).sort(params.sort);
    if (params.includeDeleted) {
        findQuery.setOptions({ withDeleted: true });
    }
    if (params.populate) {
        (findQuery as unknown as {
            populate: (arg: unknown) => void;
        }).populate(params.populate);
    }
    if (params.select) {
        findQuery.select(params.select);
    }

    const countQuery = adminModel.countDocuments(adminQuery);
    if (params.includeDeleted) {
        countQuery.setOptions({ withDeleted: true });
    }

    return Promise.all([findQuery, countQuery]);
};

const tryAdminCatalogReadSwitch = async <T extends Document>(params: {
    req: Request;
    model: Model<T>;
    query: Record<string, unknown>;
    sort: Record<string, 1 | -1>;
    skip: number;
    limit: number;
    populate?: unknown;
    select?: string;
    includeDeleted?: boolean;
    transformResponse?: (items: unknown[]) => unknown | Promise<unknown>;
    userItems: unknown[];
    userTotal: number;
}): Promise<{ items: unknown[]; total: number } | null> => {
    try {
        const [adminItems, adminTotal] = await readAdminCatalogPage({
            model: params.model as unknown as Model<Document>,
            query: params.query,
            sort: params.sort,
            skip: params.skip,
            limit: params.limit,
            populate: params.populate,
            select: params.select,
            includeDeleted: params.includeDeleted,
        });
        const resolvedAdminItems = params.transformResponse
            ? await params.transformResponse(adminItems as unknown[])
            : (adminItems as unknown[]);

        if (!Array.isArray(resolvedAdminItems)) {
            return null;
        }

        const diff = summarizeCatalogReadDiff(
            params.userItems as Record<string, unknown>[],
            resolvedAdminItems as Record<string, unknown>[]
        );
        if (!diff.mismatch && params.userTotal === adminTotal) {
            return { items: resolvedAdminItems, total: adminTotal };
        }

        await recordCatalogReadDiff({
            modelName: params.model.modelName,
            query: params.query,
            userRows: params.userItems as Record<string, unknown>[],
            adminRows: resolvedAdminItems as Record<string, unknown>[],
            requestPath: params.req.originalUrl || params.req.path,
            requestMethod: params.req.method,
        });
        logger.warn('[CatalogReadSwitch] Falling back to user catalog after parity mismatch', {
            requestPath: params.req.originalUrl || params.req.path,
            modelName: params.model.modelName,
            userTotal: params.userTotal,
            adminTotal,
            mismatchSummary: diff.summary,
        });
        return null;
    } catch (error) {
        logger.warn('[CatalogReadSwitch] Falling back to user catalog after admin read failure', {
            requestPath: params.req.originalUrl || params.req.path,
            modelName: params.model.modelName,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
};

const parseSortQuery = (
    rawSort: unknown,
    defaultSort: Record<string, 1 | -1>
): Record<string, 1 | -1> => {
    if (typeof rawSort !== 'string' || rawSort.trim().length === 0) {
        return defaultSort;
    }

    const sort: Record<string, 1 | -1> = {};
    const segments = rawSort.split(',').map((segment) => segment.trim()).filter(Boolean);

    for (const segment of segments) {
        const direction: 1 | -1 = segment.startsWith('-') ? -1 : 1;
        const field = segment.replace(/^-/, '');
        if (!/^[a-zA-Z0-9_.]+$/.test(field)) {
            continue;
        }
        sort[field] = direction;
    }

    return Object.keys(sort).length > 0 ? sort : defaultSort;
};

/**
 * Generic handler for paginated content retrieval (Master Data / Catalog).
 * Standardizes the "Public vs Admin" view logic.
 */
export async function handlePaginatedContent<T extends Document>(
    req: Request,
    res: Response,
    model: Model<T>,
    options: ContentOptions = {}
) {
    try {
        const user = req.user;
        const isAdmin =
            Boolean((req as unknown as { admin?: unknown }).admin) ||
            user?.role === 'admin' ||
            user?.role === 'super_admin';
        const isUrlAdmin = req.originalUrl.includes('/admin');

        const {
            searchFields = ['name'],
            defaultSort = { name: 1 },
            publicQuery = { isActive: true },
            adminQuery = {},
            populate,
            select,
            transformResponse,
            queryParams
        } = options;

         
        const effectiveQuery = (queryParams || req.query) as Record<string, unknown>;

        const isCatalogModel = CATALOG_MODELS.includes(model.modelName);
        const useAdminCatalogReads = isCatalogModel
            ? await isEnabled(FeatureFlag.USE_ADMIN_CATALOG_READS)
            : false;
        const useAtlasCatalogSearch = isCatalogModel
            ? await isEnabled(FeatureFlag.ENABLE_ATLAS_CATALOG_SEARCH)
            : false;
        let cacheKey: string | null = null;
        
        if (isCatalogModel) {
            const roleSuffix = isUrlAdmin ? 'admin' : 'public';
            const sourceSuffix = useAdminCatalogReads ? 'admin-read' : 'user-read';
            const sortedQuery = Object.keys(effectiveQuery)
                .sort()
                .map(k => `${k}=${encodeURIComponent(String(effectiveQuery[k]))}`)
                .join('&');
            
            cacheKey = `catalog:list:${model.modelName.toLowerCase()}:${roleSuffix}:${sourceSuffix}:${req.path}?${sortedQuery}`;
            
            const cachedPayload = await getCache<CachedPaginatedPayload>(cacheKey);
            if (cachedPayload) {
                const etagValue = `W/"${Buffer.from(JSON.stringify(cachedPayload)).toString('base64').substring(0, 24)}"`;
                res.setHeader('ETag', etagValue);
                if (req.headers['if-none-match'] === etagValue) {
                    return res.status(304).end();
                }

                if (isUrlAdmin) {
                    if (
                        Array.isArray(cachedPayload.items) &&
                        typeof cachedPayload.total === 'number' &&
                        typeof cachedPayload.page === 'number' &&
                        typeof cachedPayload.limit === 'number'
                    ) {
                        return sendPaginatedResponse(res, cachedPayload.items, cachedPayload.total, cachedPayload.page, cachedPayload.limit);
                    }
                    return sendSuccessResponse(res, cachedPayload);
                } else {
                    return sendSuccessResponse(res, cachedPayload);
                }
            }
        }

        if (isAdmin && isUrlAdmin) {
            const { page, limit, skip } = getPaginationParams(req);
            const rawSearch = effectiveQuery.q || effectiveQuery.search;
            const searchVal = Array.isArray(rawSearch) ? (rawSearch as unknown[])[0] : rawSearch;
            const searchStartedAt = Date.now();
            const search = typeof searchVal === 'string' ? searchVal.trim().slice(0, 120) : '';
            const includeDeleted = effectiveQuery.includeDeleted === 'true';
            if (search && limit <= 50 && shouldSuppressAutocomplete({ key: req.ip || 'admin', search, limit })) {
                return sendPaginatedResponse(res, [], 0, page, limit);
            }

            const query: Record<string, unknown> = { ...adminQuery };

            if (!includeDeleted && !('isDeleted' in query)) {
                query.isDeleted = { $ne: true };
            }

            // Apply search
            if (search && searchFields.length > 0) {
                query.$or = buildRegexSearchClauses(search, searchFields);
            }

            // Allowlisted URL params that can be forwarded to MongoDB as field filters.
            // SSOT: do NOT expand this list without a schema review — arbitrary params
            // create accidental filter injection (e.g. ?sort=name → query.sort="name").
            const ALLOWED_FILTER_PARAMS = new Set([
                'status', 'isActive', 'categoryId', 'categoryIds', 'brandId', 'modelId',
                'parentModelId', 'variantOfModelId', 'variantModelId',
                'type', 'needsReview', 'suggestedBy', 'createdBy', 'listingType',
            ]);
            // Params handled elsewhere or purely for presentation — never forward to Mongo.
            const IGNORED_PARAMS = new Set([
                'page', 'limit', 'q', 'search', 'includeDeleted', 'sort', 'order', 'tab', 'view',
            ]);

            Object.entries(effectiveQuery).forEach(([key, value]) => {
                if (IGNORED_PARAMS.has(key)) return;
                if (!ALLOWED_FILTER_PARAMS.has(key)) {
                    // Unknown param: skip and do not inject into Mongo query
                    return;
                }
                if (value === 'all' || value === '' || value === undefined) {
                    return;
                }
                let targetKey = key;
                if (key === 'categoryId' && model.schema?.paths && 'categoryIds' in model.schema.paths) {
                    targetKey = 'categoryIds';
                }
                if (key === 'variantModelId' && model.schema?.paths && 'variantOfModelId' in model.schema.paths) {
                    targetKey = 'variantOfModelId';
                }
                if (query[targetKey] !== undefined) {
                    return;
                }
                if (targetKey === 'status' && value === 'deleted' && query.isDeleted === true) {
                    return;
                }
                let targetValue = value;
                if (targetKey === 'isActive') {
                    if (value === 'true') targetValue = true;
                    if (value === 'false') targetValue = false;
                }
                query[targetKey] = targetValue;
            });

            // Honour the ?sort= param as a sort directive (not a Mongo field filter).
            const rawAdminSort = Array.isArray(effectiveQuery.sort)
                ? (effectiveQuery.sort as unknown[])[0]
                : effectiveQuery.sort;
            const adminSort = parseSortQuery(rawAdminSort, { createdAt: -1 });

            const atlasSearch = search && useAtlasCatalogSearch
                ? await tryAtlasCatalogSearch({
                    model: model as unknown as Model<Document>,
                    query,
                    search,
                    searchFields,
                    skip,
                    limit,
                })
                : null;
            const effectiveFindQuery = atlasSearch?.ids.length
                ? { ...query, _id: { $in: atlasSearch.ids } }
                : query;

            const findQuery = model.find(effectiveFindQuery).skip(atlasSearch ? 0 : skip).limit(limit).sort(atlasSearch ? {} : adminSort);
            if (includeDeleted) {
                findQuery.setOptions({ withDeleted: true });
            }
            if (populate) {
                (findQuery as unknown as {
                    populate: (arg: unknown) => void;
                }).populate(populate);
            }
            if (select) {
                findQuery.select(select);
            }

            const countQuery = model.countDocuments(query);
            if (includeDeleted) {
                countQuery.setOptions({ withDeleted: true });
            }

            const [items, total] = await Promise.all([
                findQuery,
                countQuery
            ]);

            const resolvedItems = transformResponse
                ? await transformResponse(items as unknown[])
                : (items as unknown[]);
            const rankedItems = search && Array.isArray(resolvedItems)
                ? rankCatalogSearchResults(resolvedItems, search, searchFields, atlasSearch?.scores, {
                    autocomplete: limit <= 50,
                    collapseVariants: limit <= 50,
                })
                : resolvedItems;
            if (search) {
                recordCatalogSearchTelemetry({
                    search,
                    latencyMs: Date.now() - searchStartedAt,
                    resultCount: Array.isArray(rankedItems) ? rankedItems.length : 0,
                    autocomplete: limit <= 50,
                });
            }

            if (useAdminCatalogReads && Array.isArray(rankedItems)) {
                const adminRead = await tryAdminCatalogReadSwitch({
                    req,
                    model: model as unknown as Model<Document>,
                    query,
                    sort: adminSort,
                    skip,
                    limit,
                    populate,
                    select,
                    includeDeleted,
                    transformResponse,
                    userItems: rankedItems,
                    userTotal: total,
                });
                if (adminRead) {
                    const payload = { items: adminRead.items, total: adminRead.total, page, limit };
                    if (cacheKey) await setCache(cacheKey, payload, CACHE_TTLS.CATEGORIES);
                    return sendPaginatedResponse(res, adminRead.items, adminRead.total, page, limit);
                }
            }

            if (!useAdminCatalogReads && Array.isArray(rankedItems)) {
                void runCatalogShadowRead({
                    modelName: model.modelName,
                    query,
                    sort: adminSort,
                    skip,
                    limit,
                    userRows: rankedItems as Record<string, unknown>[],
                    requestPath: req.originalUrl || req.path,
                    requestMethod: req.method,
                });
            }
            if (!Array.isArray(rankedItems)) {
                if (cacheKey) await setCache(cacheKey, rankedItems, CACHE_TTLS.CATEGORIES);
                return sendSuccessResponse(res, rankedItems);
            }
            
            const payload = { items: rankedItems, total, page, limit };
            if (cacheKey) await setCache(cacheKey, payload, CACHE_TTLS.CATEGORIES);
            return sendPaginatedResponse(res, rankedItems, total, page, limit);
        }

        // Public View
        const rawPage = effectiveQuery.page;
        const rawLimit = effectiveQuery.limit;
        const rawSearchVal = effectiveQuery.q || effectiveQuery.search;
        const rawSearch = Array.isArray(rawSearchVal) ? (rawSearchVal as unknown[])[0] : rawSearchVal;
        const rawSort = Array.isArray(effectiveQuery.sort) ? (effectiveQuery.sort as unknown[])[0] : effectiveQuery.sort;
        const parsedPage = parseInt(String(rawPage || '1'));
        const parsedLimit = parseInt(String(rawLimit || '100'));
        const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const limit = Math.min(Math.max(Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 100, 1), 100);
        const searchStartedAt = Date.now();
        const search = typeof rawSearch === 'string' ? rawSearch.trim().slice(0, 120) : '';
        const sort = parseSortQuery(rawSort, defaultSort);
        if (search && limit <= 50 && shouldSuppressAutocomplete({ key: req.ip || 'public', search, limit })) {
            return sendSuccessResponse(res, { items: [], total: 0 });
        }

        const query: Record<string, unknown> = { ...publicQuery };

        // Public query hardening: do not merge arbitrary URL params into Mongo query.
        if (search && searchFields.length > 0) {
            query.$or = buildRegexSearchClauses(search, searchFields);
        }
        
        // Allow explicit listingType filtering in public views (e.g. for Post Ad Step 1)
        if (typeof effectiveQuery.listingType === 'string') {
            const rawListingType = effectiveQuery.listingType.trim();
            if (LISTING_TYPE_VALUES.includes(rawListingType as ListingTypeValue)) {
                query.listingType = rawListingType;
            }
        }

        const atlasSearch = search && useAtlasCatalogSearch
            ? await tryAtlasCatalogSearch({
                model: model as unknown as Model<Document>,
                query,
                search,
                searchFields,
                skip: (page - 1) * limit,
                limit,
            })
            : null;
        const effectiveFindQuery = atlasSearch?.ids.length
            ? { ...query, _id: { $in: atlasSearch.ids } }
            : query;
        const findQuery = model.find(effectiveFindQuery).skip(atlasSearch ? 0 : (page - 1) * limit).limit(limit).sort(atlasSearch ? {} : sort);
        if (populate) {
            (findQuery as unknown as {
                populate: (arg: unknown) => void;
            }).populate(populate);
        }
        if (select) {
            findQuery.select(select);
        }

        const [items, total] = await Promise.all([
            findQuery,
            model.countDocuments(query)
        ]);

        const resolvedItems = transformResponse
            ? await transformResponse(items as unknown[])
            : (items as unknown[]);
        const rankedItems = search && Array.isArray(resolvedItems)
            ? rankCatalogSearchResults(resolvedItems, search, searchFields, atlasSearch?.scores, {
                autocomplete: limit <= 50,
                collapseVariants: limit <= 50,
            })
            : resolvedItems;
        if (search) {
            recordCatalogSearchTelemetry({
                search,
                latencyMs: Date.now() - searchStartedAt,
                resultCount: Array.isArray(rankedItems) ? rankedItems.length : 0,
                autocomplete: limit <= 50,
            });
        }

        if (useAdminCatalogReads && Array.isArray(rankedItems)) {
            const adminRead = await tryAdminCatalogReadSwitch({
                req,
                model: model as unknown as Model<Document>,
                query,
                sort,
                skip: (page - 1) * limit,
                limit,
                populate,
                select,
                transformResponse,
                userItems: rankedItems,
                userTotal: total,
            });
            if (adminRead) {
                const payload = { items: adminRead.items, total: adminRead.total };
                if (cacheKey) await setCache(cacheKey, payload, CACHE_TTLS.CATEGORIES);
                return sendSuccessResponse(res, payload);
            }
        }

        if (!useAdminCatalogReads && Array.isArray(rankedItems)) {
            void runCatalogShadowRead({
                modelName: model.modelName,
                query,
                sort,
                skip: (page - 1) * limit,
                limit,
                userRows: rankedItems as Record<string, unknown>[],
                requestPath: req.originalUrl || req.path,
                requestMethod: req.method,
            });
        }

        if (!Array.isArray(rankedItems)) {
            if (cacheKey) await setCache(cacheKey, rankedItems, CACHE_TTLS.CATEGORIES);
            return sendSuccessResponse(res, rankedItems);
        }

        const payload = { items: rankedItems, total };
        if (cacheKey) await setCache(cacheKey, payload, CACHE_TTLS.CATEGORIES);
        return sendSuccessResponse(res, payload);
    } catch (error) {
        sendAdminError(req, res, error);
    }
}

