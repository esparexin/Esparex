/**
 * Catalog Brand & Model Controller
 * Handles brands and models together due to close relationship
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import logger from '@esparex/core/utils/logger';
import { sendSuccessResponse } from "@esparex/core/utils/respond";
import { handlePaginatedContent } from "@esparex/core/utils/contentHandler";
import mongoose from 'mongoose';
import { CATALOG_APPROVAL_STATUS } from '@esparex/shared';
import { getUserConnection } from '@esparex/core/config/db';
import {
    BrandModel,
    CatalogModel,
    findCategoryBySlugForCatalog,
    findBrandByFilter,
    getActiveBrandIds,
    checkBrandInCategories,
    checkBrandDependencies,
    findModelByFilter,
    checkModelDependencies,
    findModelBySlug,
} from '@esparex/core/services/catalog/CatalogBrandModelService';
import { validateBrandIsActive } from '@esparex/core/services/catalog/CatalogValidationService';
import CatalogOrchestrator from '@esparex/core/services/catalog/CatalogOrchestrator';
import {
    sendCatalogError,
    QueryRecord,
    ACTIVE_CATEGORY_QUERY,
    validateActiveCategories,
    getActiveCategoryIds,
    handleCatalogCreate,
    handleCatalogUpdate,
    handleCatalogToggleStatus,
    handleCatalogDelete,
    handleCatalogReview,
    sendEmptyPublicList,
    applyCatalogStatusFilter,
    hasAdminAccess,
    CATALOG_PUBLIC_VISIBILITY_QUERY,
    deriveApprovalStatus
} from './shared';
import { logAdminAction } from '@esparex/core/utils/adminLogger';
import { toOptionalString, toStringArray } from './inputCoercion';
import {
    brandCreateSchema,
    brandUpdateSchema,
    modelCreateSchema,
    modelUpdateSchema,
    rejectionSchema
} from '@esparex/core/validators/catalog.validator';
import CategoryQueryBuilder from '@esparex/core/utils/CategoryQueryBuilder';
import { getCache, setCache } from '@esparex/core/utils/redisCache';
import VariantModel from '@esparex/core/models/Variant';
import {
    MAX_MODEL_TREE_DEPTH,
    type ModelHierarchyDoc,
    updateModelHierarchyTransactionally,
    validateModelHierarchyMutation,
} from '@esparex/core/services/catalog/CatalogHierarchyService';
import { detectDuplicateCandidates } from '@esparex/core/services/catalog/CatalogSearchGovernanceService';

// ── Cache helpers ──────────────────────────────────────────────────────────
const CATALOG_CACHE_TTL = 300; // 5 minutes
const normalizeCacheValue = (value: unknown): string => {
    if (Array.isArray(value)) return value.map(normalizeCacheValue).join(',');
    if (value === undefined || value === null || value === '') return 'all';
    return encodeURIComponent(String(value));
};

const catalogCacheKey = {
    brands: (categoryId: string) => `catalog:brands:${normalizeCacheValue(categoryId)}`,
    models: (params: {
        categoryId?: unknown;
        brandId?: unknown;
        parentModelId?: unknown;
        variantModelId?: unknown;
        includeVariants?: unknown;
        treeView?: unknown;
        search?: unknown;
        q?: unknown;
        page?: unknown;
        limit?: unknown;
        sort?: unknown;
    }) => [
        'catalog:models',
        `category=${normalizeCacheValue(params.categoryId)}`,
        `brand=${normalizeCacheValue(params.brandId)}`,
        `parent=${normalizeCacheValue(params.parentModelId)}`,
        `variant=${normalizeCacheValue(params.variantModelId)}`,
        `includeVariants=${normalizeCacheValue(params.includeVariants)}`,
        `treeView=${normalizeCacheValue(params.treeView)}`,
        `search=${normalizeCacheValue(params.search ?? params.q)}`,
        `page=${normalizeCacheValue(params.page ?? 1)}`,
        `limit=${normalizeCacheValue(params.limit ?? 100)}`,
        `sort=${normalizeCacheValue(params.sort ?? 'name')}`,
    ].join(':'),
};

const normalizeOptionalObjectIdQuery = (value: unknown): string | undefined => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string') return undefined;
    const normalized = raw.trim();
    if (!normalized || normalized === 'all') return undefined;
    return mongoose.Types.ObjectId.isValid(normalized) ? normalized : undefined;
};

const normalizeBooleanQuery = (value: unknown): boolean => {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw === true || raw === 'true' || raw === '1';
};

const populateModelVariants = async (items: unknown[]) => {
    const modelIds = items
        .map((item) => {
            const model = item as { _id?: unknown; id?: unknown };
            return model._id ?? model.id;
        })
        .filter(Boolean)
        .map(String);

    if (modelIds.length === 0) return items;

    const [variantDocs, variantModelDocs] = await Promise.all([
        VariantModel.find({
            modelId: { $in: modelIds },
            isDeleted: { $ne: true },
        }).sort({ name: 1 }).lean(),
        CatalogModel.find({
            variantOfModelId: { $in: modelIds },
            isDeleted: { $ne: true },
        }).sort({ name: 1 }).lean(),
    ]);

    const variantsByModelId = new Map<string, unknown[]>();
    for (const variant of variantDocs) {
        const modelId = String((variant as { modelId?: unknown }).modelId ?? '');
        if (!modelId) continue;
        const existing = variantsByModelId.get(modelId) ?? [];
        existing.push(variant);
        variantsByModelId.set(modelId, existing);
    }

    const variantModelsByParentId = new Map<string, unknown[]>();
    for (const variantModel of variantModelDocs) {
        const parentId = String((variantModel as { variantOfModelId?: unknown }).variantOfModelId ?? '');
        if (!parentId) continue;
        const existing = variantModelsByParentId.get(parentId) ?? [];
        existing.push(variantModel);
        variantModelsByParentId.set(parentId, existing);
    }

    return items.map((item) => {
        const plain = typeof (item as { toObject?: () => unknown }).toObject === 'function'
            ? (item as { toObject: () => Record<string, unknown> }).toObject()
            : { ...(item as Record<string, unknown>) };
        const id = String(plain._id ?? plain.id ?? '');
        return {
            ...plain,
            variants: variantsByModelId.get(id) ?? [],
            variantModels: variantModelsByParentId.get(id) ?? [],
        };
    });
};

const applyModelHierarchyPayload = async (
    payload: Record<string, unknown>,
    options: { existingModel?: unknown } = {}
) => {
    const normalizedPayload = {
        ...payload,
        brandId: toOptionalString(payload.brandId) ?? payload.brandId,
        parentModelId: payload.parentModelId === null ? null : toOptionalString(payload.parentModelId) ?? payload.parentModelId,
        variantOfModelId: payload.variantOfModelId === null ? null : toOptionalString(payload.variantOfModelId) ?? payload.variantOfModelId,
    };
    return validateModelHierarchyMutation(normalizedPayload, {
        existingModel: options.existingModel as ModelHierarchyDoc | null | undefined,
    });
};

const logModelDuplicateCandidates = async (
    req: Request,
    payload: Record<string, unknown>,
    options: { excludeId?: string } = {}
) => {
    const name = String(payload.displayName ?? payload.name ?? payload.canonicalName ?? '').trim();
    const brandId = toOptionalString(payload.brandId);
    if (!name || !brandId) return;

    const candidates = await CatalogModel.find({
        brandId,
        isDeleted: { $ne: true },
        ...(options.excludeId ? { _id: { $ne: options.excludeId } } : {}),
    })
        .select('_id name displayName canonicalName slug aliases synonyms parentModelId variantOfModelId')
        .limit(100)
        .lean();
    const duplicateCandidates = detectDuplicateCandidates(name, candidates as unknown as Record<string, unknown>[]);
    if (duplicateCandidates.length > 0) {
        logger.warn('[CatalogSearch] Potential model duplicate candidates detected', {
            requestPath: req.originalUrl || req.path,
            candidateCount: duplicateCandidates.length,
            input: name,
            candidates: duplicateCandidates,
        });
    }
};

/** Wraps res.json to write-through to Redis on success (public path only). */
const applyCacheWriteThrough = (res: Response, cacheKey: string) => {
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            setCache(cacheKey, body, CATALOG_CACHE_TTL).catch(() => { /* silent */ });
        }
        return originalJson(body);
    };
};

// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// Most brand/model logic now delegated to shared.ts generic handlers.


/* ==========================================================
   BRANDS
   ========================================================== */

/**
 * Get all brands (with optional category filter)
 */
export const getBrands = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const categoryId = req.query.categoryId as string;
    let categoryObjectId: string | undefined = (categoryId && categoryId !== 'all') ? categoryId : undefined;

    if (!isAdminView && categoryId && categoryId !== 'all') {
        // Public view allows passing slug for categoryId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const cat = await findCategoryBySlugForCatalog(categoryId, ACTIVE_CATEGORY_QUERY);
            if (cat) categoryObjectId = cat._id.toString();
            else logger.debug('[Catalog] Category not found by slug (getBrands)', { categorySlug: categoryId });
        }
    }

    // Public view strictly requires categoryId
    if (!isAdminView && !categoryObjectId) {
        logger.debug('[Catalog] getBrands missing categoryId (public)', { providedId: categoryId });
        return sendCatalogError(req, res, 'categoryId is required', 400);
    }
    if (!isAdminView) {
        // ── Redis cache (public path only) ────────────────────────────────────
        const cacheKey = catalogCacheKey.brands(categoryObjectId ?? 'all');
        const cached = await getCache<unknown>(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        applyCacheWriteThrough(res, cacheKey);
    }

    if (!isAdminView && categoryObjectId) {
        const activeCategoryValidation = await validateActiveCategories([categoryObjectId]);
        if (!activeCategoryValidation.ok) {
            logger.debug('[Catalog] Category not active (getBrands)', { categoryId: categoryObjectId });
            return sendEmptyPublicList(res);
        }
    }

    const queryParams: QueryRecord = { ...(req.query as QueryRecord) };
    delete queryParams.categoryId;
    delete queryParams.categoryIds;
    delete queryParams.status;

    const categoryFilter = CategoryQueryBuilder.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();
    const adminCategoryFilter = CategoryQueryBuilder.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();
    const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    applyCatalogStatusFilter(adminCategoryFilter, rawStatus);

    return handlePaginatedContent(req, res, BrandModel, {
        searchFields: ['name', 'canonicalName', 'aliases'],
        publicQuery: {
            ...CATALOG_PUBLIC_VISIBILITY_QUERY,
            ...categoryFilter
        },
        adminQuery: adminCategoryFilter,
        queryParams
    });
};

/**
 * Get single brand by ID
 */
export const getBrandById = async (req: Request, res: Response) => {
    try {
        const isAdminView = req.originalUrl.includes('/admin');
        const brand = await findBrandByFilter({
            _id: req.params.id,
            ...(isAdminView
                ? {}
                : {
                    ...CATALOG_PUBLIC_VISIBILITY_QUERY,
                })
        });
        if (!brand) return sendCatalogError(req, res, 'Brand not found', 404);
        sendSuccessResponse(res, brand);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Get single public brand by slug
 */
export const getBrandBySlug = async (req: Request, res: Response) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) {
            return sendCatalogError(req, res, 'Brand slug is required', 400);
        }

        const slugAlias = slug.replace(/-/g, ' ');
        const brand = await findBrandByFilter({
            ...CATALOG_PUBLIC_VISIBILITY_QUERY,
            $or: [
                { slug },
                { canonicalName: slugAlias },
                { aliases: { $in: [slugAlias, slug] } },
            ]
        });

        if (!brand) {
            return sendCatalogError(req, res, 'Brand not found', 404);
        }

        sendSuccessResponse(res, brand);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new brand
 */
export const createBrand = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, BrandModel, brandCreateSchema, {
        auditAction: 'BRAND_CREATE',
        slugifyName: true,
        preOp: async (payload) => {
            const categoryIds = Array.isArray(payload.categoryIds)
                ? (payload.categoryIds as string[]).map(String)
                : [];
            payload.categoryIds = categoryIds;

            if (categoryIds.length === 0) {
                payload.isActive = false;
            }

            const approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus,
                isActive: payload.isActive as boolean | undefined,
                fallback: CATALOG_APPROVAL_STATUS.APPROVED,
            });
            payload.approvalStatus = approvalStatus;

            const categoryValidation = await validateActiveCategories(categoryIds);
            if (!categoryValidation.ok) {
                throw new Error(`Invalid or inactive categories: ${categoryValidation.invalidCategoryIds.join(', ')}`);
            }
            return payload;
        },
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });
};

/**
 * Update existing brand
 */
export const updateBrand = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, BrandModel, brandUpdateSchema, {
        auditAction: 'BRAND_RENAME',
        preUpdate: async (_id, payload, oldBrand) => {
            const typedOldBrand = oldBrand as { categoryIds?: unknown[]; approvalStatus?: unknown; isActive?: boolean };
            
            const nextCategoryIds = payload.categoryIds
                ? (payload.categoryIds as string[]).map(String)
                : (typedOldBrand.categoryIds || []).map(String);
            
            payload.categoryIds = nextCategoryIds;

            if (nextCategoryIds.length === 0) {
                payload.isActive = false;
            }

            payload.approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus ?? typedOldBrand.approvalStatus,
                isActive: (payload.isActive ?? typedOldBrand.isActive) as boolean | undefined,
                fallback: CATALOG_APPROVAL_STATUS.APPROVED,
            });

            const categoryValidation = await validateActiveCategories(nextCategoryIds);
            if (!categoryValidation.ok) {
                throw new Error(`Invalid or inactive categories: ${categoryValidation.invalidCategoryIds.join(', ')}`);
            }
            return payload;
        },
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });
};

/**
 * Toggle brand active status
 */
export const toggleBrandStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, BrandModel, {
        auditAction: 'TOGGLE_BRAND_STATUS',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });
};

export const deleteBrand = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) {
            return res.status(403).json({
                success: false,
                error: 'Admin access required',
                path: req.originalUrl || req.path,
                status: 403
            });
        }

        const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Brand ID format',
                path: req.originalUrl || req.path,
                status: 400
            });
        }

        // Treat already deleted brands as a successful idempotent operation.
        const existingBrand = await BrandModel.findOne({ _id: id }).setOptions({ withDeleted: true });
        if (!existingBrand || existingBrand.isDeleted) {
            return res.status(200).json({
                success: true,
                message: 'Brand and dependent models and spare parts soft-deleted successfully',
                data: {
                    brandId: id,
                    deletedModels: 0,
                    deletedSpareParts: 0,
                    alreadyDeleted: true
                }
            });
        }

        const deps = await checkBrandDependencies(id);
        
        // If there are any dependencies (models, listings, etc.), prevent deletion to maintain integrity.
        if (deps.count > 0) {
            return res.status(409).json({
                success: false,
                error: 'Brand cannot be deleted because dependencies exist',
                status: 409,
                details: {
                    models: deps.details.models,
                    listings: deps.details.listings,
                    spareParts: deps.details.spareParts,
                    screenSizes: deps.details.screenSizes,
                    smartAlerts: deps.details.smartAlerts
                }
            });
        }

        const softDeleteUpdate: Record<string, unknown> = {
            isDeleted: true,
            deletedAt: new Date(),
            isActive: false,
        };

        const performDelete = async (txSession: mongoose.ClientSession | null) => {
            const brand = txSession
                ? await BrandModel.findByIdAndUpdate(id, softDeleteUpdate, { new: true }).session(txSession)
                : await BrandModel.findByIdAndUpdate(id, softDeleteUpdate, { new: true });

            if (!brand) {
                return { deletedModels: 0, deletedSpareParts: 0, brand };
            }

            // Cascade soft-delete all models belonging to this brand and their spare parts
            const cascadeRes = await CatalogOrchestrator.cascadeBrandDelete(id, txSession ?? undefined);
            return {
                deletedModels: cascadeRes.deletedModels,
                deletedSpareParts: cascadeRes.deletedSpareParts,
                brand
            };
        };

        let session: mongoose.ClientSession | null = null;
        let deletedModels = 0;
        let deletedSpareParts = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- brand document shape is dynamic
        let brandDoc: any = null;

        try {
            session = await getUserConnection().startSession();
            session.startTransaction();
            const resData = await performDelete(session);
            deletedModels = resData.deletedModels;
            deletedSpareParts = resData.deletedSpareParts;
            brandDoc = resData.brand;
            await session.commitTransaction();
        } catch (e: unknown) {
            if (session) {
                try {
                    await session.abortTransaction();
                } catch (abortErr) {
                    logger.debug(`Failed to abort transaction: ${abortErr}`);
                }
                try {
                    await session.endSession();
                } catch (endErr) {
                    logger.debug(`Failed to end session: ${endErr}`);
                }
                session = null;
            }

            const errorMessage = e instanceof Error ? e.message : String(e);
            const isSessionError = /session|transaction|mongoclient/i.test(errorMessage);

            if (isSessionError) {
                logger.warn(`Transaction session failed (${errorMessage}). Retrying sequential soft-delete sessionless...`);
                const resData = await performDelete(null);
                deletedModels = resData.deletedModels;
                deletedSpareParts = resData.deletedSpareParts;
                brandDoc = resData.brand;
            } else {
                throw e;
            }
        } finally {
            if (session) {
                try {
                    await session.endSession();
                } catch (endErr) {
                    logger.debug(`Failed to end session in finally: ${endErr}`);
                }
            }
        }

        if (!brandDoc) {
            return res.status(200).json({
                success: true,
                message: 'Brand and dependent models and spare parts soft-deleted successfully',
                data: {
                    brandId: id,
                    deletedModels: 0,
                    deletedSpareParts: 0,
                    alreadyDeleted: true
                }
            });
        }

        void logAdminAction(req, 'BRAND_DELETE', 'Brand', brandDoc._id);

        return res.status(200).json({
            success: true,
            message: 'Brand and dependent models and spare parts soft-deleted successfully',
            data: {
                brandId: id,
                deletedModels,
                deletedSpareParts,
                alreadyDeleted: false
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return res.status(500).json({
            success: false,
            error: message,
            path: req.originalUrl || req.path,
            status: 500
        });
    }
};

/* ==========================================================
   MODELS
   ========================================================== */

/**
 * Get all models (with optional brand/category filters)
 */
export const getModels = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const { brandId } = req.query;
    const brandObjectId = (typeof brandId === 'string' && brandId !== 'all') ? brandId : undefined;
    const parentModelId = normalizeOptionalObjectIdQuery(req.query.parentModelId);
    const variantModelId = normalizeOptionalObjectIdQuery(req.query.variantModelId);
    const includeVariants = normalizeBooleanQuery(req.query.includeVariants);
    const treeView = normalizeBooleanQuery(req.query.treeView);
    const categoryId = req.query.categoryId as string;
    const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;

    let categoryObjectId: string | undefined = (categoryId && categoryId !== 'all') ? categoryId : undefined;
    if (!isAdminView && categoryId && categoryId !== 'all') {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const cat = await findCategoryBySlugForCatalog(categoryId, ACTIVE_CATEGORY_QUERY);
            if (cat) categoryObjectId = cat._id.toString();
        }
    }
    // ── Redis cache (public path only) ─────────────────────────────────────
    if (!isAdminView) {
        const cacheKey = catalogCacheKey.models({
            categoryId: categoryObjectId,
            brandId: brandObjectId,
            parentModelId,
            variantModelId,
            includeVariants: req.query.includeVariants,
            treeView: req.query.treeView,
            search: req.query.search,
            q: req.query.q,
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort,
        });
        const cached = await getCache<unknown>(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        applyCacheWriteThrough(res, cacheKey);
    }

    if (!isAdminView && categoryObjectId) {
        const activeCategoryValidation = await validateActiveCategories([categoryObjectId]);
        if (!activeCategoryValidation.ok) {
            return sendEmptyPublicList(res);
        }
    }

    let activeCategoryIds: string[] = [];
    if (!isAdminView) {
        activeCategoryIds = categoryObjectId ? [categoryObjectId] : await getActiveCategoryIds();
        if (activeCategoryIds.length === 0) {
            return sendEmptyPublicList(res);
        }
    }
    const activeBrandIds = !isAdminView
        ? await getActiveBrandIds(activeCategoryIds)
        : [];
    if (!isAdminView && activeBrandIds.length === 0) {
        return sendEmptyPublicList(res);
    }

    const adminQuery: QueryRecord = {};
    if (brandObjectId) adminQuery.brandId = brandObjectId;
    if (parentModelId) {
        adminQuery.parentModelId = parentModelId;
    }
    if (variantModelId) {
        adminQuery.variantOfModelId = variantModelId;
    }
    if (treeView && !parentModelId && !variantModelId) {
        adminQuery.variantOfModelId = { $in: [null] };
        adminQuery.treeDepth = { $lte: MAX_MODEL_TREE_DEPTH };
    }
    if (categoryId) {
        Object.assign(adminQuery, CategoryQueryBuilder.forPlural().withFilters({ categoryIds: [categoryId] }).build());
    }
    applyCatalogStatusFilter(adminQuery, rawStatus);

    const publicQuery: QueryRecord = {
        ...CATALOG_PUBLIC_VISIBILITY_QUERY,
    };
    if (!isAdminView) {
        Object.assign(publicQuery, CategoryQueryBuilder.forPlural().withFilters({ categoryIds: activeCategoryIds }).build());
        publicQuery.brandId = { $in: activeBrandIds };
    }
    if (brandObjectId) publicQuery.brandId = brandObjectId;
    if (parentModelId) {
        publicQuery.parentModelId = parentModelId;
    }
    if (variantModelId) {
        publicQuery.variantOfModelId = variantModelId;
    }
    if (treeView && !parentModelId && !variantModelId) {
        publicQuery.variantOfModelId = { $in: [null] };
        publicQuery.treeDepth = { $lte: MAX_MODEL_TREE_DEPTH };
    }
    if (categoryObjectId) {
        Object.assign(publicQuery, CategoryQueryBuilder.forPlural().withFilters({ categoryIds: [categoryObjectId] }).build());
    }

    if (!isAdminView && brandObjectId) {
        const brandExists = await checkBrandInCategories(brandObjectId, activeCategoryIds);
        if (!brandExists) {
            return sendEmptyPublicList(res);
        }
    }
    const queryParams: QueryRecord = { ...(req.query as QueryRecord) };

    return handlePaginatedContent(req, res, CatalogModel, {
        populate: isAdminView ? undefined : 'brandId categoryIds parentModelId variantOfModelId',
        adminQuery,
        publicQuery,
        searchFields: ['name', 'displayName', 'canonicalName', 'slug', 'aliases', 'synonyms'],
        queryParams,
        transformResponse: includeVariants ? populateModelVariants : undefined,
    });
};

/**
 * Get single model by ID
 */
export const getModelById = async (req: Request, res: Response) => {
    try {
        const isAdminView = req.originalUrl.includes('/admin');
        const model = await findModelByFilter({
            _id: req.params.id,
            ...(isAdminView
                ? {}
                : {
                    ...CATALOG_PUBLIC_VISIBILITY_QUERY,
                })
        });
        if (!model) return sendCatalogError(req, res, 'Model not found', 404);
        sendSuccessResponse(res, model);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/** Get single public model by canonical slug (with alias fallback). */
export const getModelBySlug = async (req: Request, res: Response) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) {
            return sendCatalogError(req, res, 'Model slug is required', 400);
        }

        const slugAlias = slug.replace(/-/g, ' ');
        const baseFilter = { ...CATALOG_PUBLIC_VISIBILITY_QUERY };

        const model = await findModelBySlug(slug, baseFilter) || await findModelByFilter({
            ...baseFilter,
            $or: [
                { canonicalName: slugAlias },
                { aliases: { $in: [slugAlias, slug] } },
            ]
        });

        if (!model) {
            return sendCatalogError(req, res, 'Model not found', 404);
        }
        sendSuccessResponse(res, model);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new model
 */
export const createModel = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, CatalogModel, modelCreateSchema, {
        auditAction: 'MODEL_CREATE',
        preOp: async (payload) => {
            const brandId = toOptionalString(payload.brandId);
            const categoryIds = toStringArray(payload.categoryIds);

            // Auto-derive categoryIds if missing
            if (!categoryIds || categoryIds.length === 0) {
                if (!brandId) throw new Error('brandId is required');
                const derivedId = await CatalogOrchestrator.resolvePrimaryCategoryIdFromBrand(brandId);
                if (derivedId) {
                    payload.categoryIds = [derivedId.toString()];
                } else {
                    payload.categoryIds = [];
                    payload.isActive = false;
                }
            } else {
                payload.categoryIds = categoryIds;
            }

            if (!brandId) throw new Error('brandId is required');
            payload.brandId = brandId;
            const { ok, reason } = await validateBrandIsActive(brandId);
            if (!ok) throw new Error(reason || 'brandId must reference an active, non-deleted brand');

            if (!payload.categoryIds || (payload.categoryIds as unknown[]).length === 0) {
                payload.isActive = false;
            }

            payload.approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus,
                isActive: payload.isActive as boolean | undefined,
                fallback: CATALOG_APPROVAL_STATUS.APPROVED,
            });

            const hierarchyPayload = await applyModelHierarchyPayload(payload);
            void logModelDuplicateCandidates(req, hierarchyPayload).catch((error) => {
                logger.debug('[CatalogSearch] Duplicate candidate check skipped', { error: error instanceof Error ? error.message : String(error) });
            });
            return hierarchyPayload;
        },
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });
};

/**
 * Update existing model
 */
export const updateModel = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, CatalogModel, modelUpdateSchema, {
        auditAction: 'MODEL_RENAME',
        preUpdate: async (_id, payload, existingModel) => {
            const brandId = toOptionalString(payload.brandId);
            const categoryIds = toStringArray(payload.categoryIds);

            if (payload.brandId !== undefined && !brandId) {
                throw new Error('brandId must be a valid string');
            }
            if (brandId) {
                payload.brandId = brandId;
                const { ok, reason } = await validateBrandIsActive(brandId);
                if (!ok) throw new Error(reason || 'brandId must reference an active, non-deleted brand');
            }
            
            // Normalize to canonical categoryIds array
            if (categoryIds && categoryIds.length > 0) {
                payload.categoryIds = categoryIds;
            } else if (payload.categoryIds !== undefined) {
                payload.categoryIds = [];
                payload.isActive = false;
            } else if ((existingModel as { categoryIds?: unknown[] }).categoryIds) {
                payload.categoryIds = ((existingModel as { categoryIds?: unknown[] }).categoryIds || []).map(String);
            }

            if (!payload.categoryIds || (payload.categoryIds as unknown[]).length === 0) {
                payload.isActive = false;
            }

            const typedExisting = existingModel as { approvalStatus?: unknown; isActive?: boolean };
            payload.approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus ?? typedExisting.approvalStatus,
                isActive: (payload.isActive ?? typedExisting.isActive) as boolean | undefined,
                fallback: CATALOG_APPROVAL_STATUS.APPROVED,
            });
            const hierarchyPayload = await applyModelHierarchyPayload(payload, { existingModel });
            void logModelDuplicateCandidates(req, hierarchyPayload, { excludeId: _id }).catch((error) => {
                logger.debug('[CatalogSearch] Duplicate candidate check skipped', { error: error instanceof Error ? error.message : String(error) });
            });
            return hierarchyPayload;
        },
        updateOp: async (id, data) => {
            const result = await updateModelHierarchyTransactionally(id, data);
            logger.info('[CatalogHierarchy] Model hierarchy mutation committed', {
                modelId: id,
                durationMs: result.metrics.durationMs,
                descendantScanCount: result.metrics.descendantScanCount,
                cascadeUpdateCount: result.metrics.cascadeUpdateCount,
            });
            return result.item;
        },
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });
};

/**
 * Toggle model active status
 */
export const toggleModelStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, CatalogModel, {
        auditAction: 'TOGGLE_MODEL_STATUS',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });
};

/**
 * Delete model (soft delete with dependency check)
 */
export const deleteModel = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, CatalogModel, checkModelDependencies, {
        auditAction: 'MODEL_DELETE',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });
};

/**
 * Approve pending brand
 */
export const approveBrand = (req: Request, res: Response) =>
    handleCatalogReview(req, res, BrandModel, 'APPROVE', undefined, {
        auditAction: 'APPROVE_BRAND',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });

/**
 * Reject pending brand
 */
export const rejectBrand = (req: Request, res: Response) =>
    handleCatalogReview(req, res, BrandModel, 'REJECT', rejectionSchema, {
        auditAction: 'REJECT_BRAND',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });

/**
 * Approve pending model
 */
export const approveModel = (req: Request, res: Response) =>
    handleCatalogReview(req, res, CatalogModel, 'APPROVE', undefined, {
        auditAction: 'APPROVE_MODEL',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });

/**
 * Reject pending model
 */
export const rejectModel = (req: Request, res: Response) =>
    handleCatalogReview(req, res, CatalogModel, 'REJECT', rejectionSchema, {
        auditAction: 'REJECT_MODEL',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] })
    });
