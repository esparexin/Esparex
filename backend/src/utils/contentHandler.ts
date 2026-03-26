import { Request, Response } from 'express';
import { Model, Document } from 'mongoose';
import { respond } from './respond';
import {
    getPaginationParams,
    sendPaginatedResponse,
    sendSuccessResponse,
    sendAdminError
} from '../controllers/admin/adminBaseController';
import { escapeRegExp } from './stringUtils';
import { sendErrorResponse as sendContractErrorResponse } from './errorResponse';

interface ContentOptions {
    searchFields?: string[];
    defaultSort?: Record<string, 1 | -1>;
    publicQuery?: Record<string, unknown>;
    adminQuery?: Record<string, unknown>;
    populate?: unknown;
    select?: string;
    transformResponse?: (items: unknown[]) => unknown | Promise<unknown>;
    queryParams?: Record<string, any>;
}

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
        const authReq = req as Request & { admin?: unknown; user?: { role?: string } };
        const isAdmin =
            Boolean(authReq.admin) ||
            authReq.user?.role === 'admin' ||
            authReq.user?.role === 'super_admin';
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

        const effectiveQuery = queryParams || req.query;

        if (isAdmin && isUrlAdmin) {
            const { page, limit, skip } = getPaginationParams(req);
            const rawSearch = Array.isArray(effectiveQuery.search) ? effectiveQuery.search[0] : effectiveQuery.search;
            const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';
            const includeDeleted = effectiveQuery.includeDeleted === 'true';

            const query: Record<string, unknown> = { ...adminQuery };

            if (!includeDeleted && !('isDeleted' in query)) {
                query.isDeleted = { $ne: true };
            }

            // Apply search
            if (search && searchFields.length > 0) {
                const safeSearch = escapeRegExp(search);
                query.$or = searchFields.map(field => ({
                    [field]: { $regex: safeSearch, $options: 'i' }
                }));
            }

            // Allowlisted URL params that can be forwarded to MongoDB as field filters.
            // SSOT: do NOT expand this list without a schema review — arbitrary params
            // create accidental filter injection (e.g. ?sort=name → query.sort="name").
            const ALLOWED_FILTER_PARAMS = new Set([
                'status', 'isActive', 'categoryId', 'brandId', 'modelId',
                'type', 'needsReview', 'suggestedBy', 'createdBy', 'listingType',
            ]);
            // Params handled elsewhere or purely for presentation — never forward to Mongo.
            const IGNORED_PARAMS = new Set([
                'page', 'limit', 'search', 'includeDeleted', 'sort', 'order', 'tab', 'view',
            ]);

            Object.entries(effectiveQuery).forEach(([key, value]) => {
                if (IGNORED_PARAMS.has(key)) return;
                if (!ALLOWED_FILTER_PARAMS.has(key)) {
                    // Unknown param: skip and do not inject into Mongo query
                    return;
                }
                query[key] = value;
            });

            // Honour the ?sort= param as a sort directive (not a Mongo field filter).
            const rawAdminSort = Array.isArray(effectiveQuery.sort)
                ? effectiveQuery.sort[0]
                : effectiveQuery.sort;
            const adminSort = parseSortQuery(rawAdminSort, { createdAt: -1 });

            const findQuery = model.find(query).skip(skip).limit(limit).sort(adminSort);
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
            if (!Array.isArray(resolvedItems)) {
                return sendSuccessResponse(res, resolvedItems);
            }
            return sendPaginatedResponse(res, resolvedItems, total, page, limit);
        }

        // Public View
        const rawPage = effectiveQuery.page;
        const rawLimit = effectiveQuery.limit;
        const rawSearch = Array.isArray(effectiveQuery.search) ? effectiveQuery.search[0] : effectiveQuery.search;
        const rawSort = Array.isArray(effectiveQuery.sort) ? effectiveQuery.sort[0] : effectiveQuery.sort;
        const page = parseInt(String(rawPage || '1'));
        const limit = parseInt(String(rawLimit || '100'));
        const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';
        const sort = parseSortQuery(rawSort, defaultSort);

        const query: Record<string, unknown> = { ...publicQuery };

        // Public query hardening: do not merge arbitrary URL params into Mongo query.
        if (search && searchFields.length > 0) {
            const safeSearch = escapeRegExp(search);
            query.$or = searchFields.map((field) => ({
                [field]: { $regex: safeSearch, $options: 'i' }
            }));
        }

        // Allow explicit listingType filtering in public views (e.g. for Post Ad Step 1)
        if (effectiveQuery.listingType) {
            query.listingType = effectiveQuery.listingType;
        }

        const findQuery = model.find(query).skip((page - 1) * limit).limit(limit).sort(sort);
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

        if (!Array.isArray(resolvedItems)) {
            return sendSuccessResponse(res, resolvedItems);
        }

        return sendSuccessResponse(res, { items: resolvedItems, total });
    } catch (error) {
        sendAdminError(req, res, error);
    }
}
