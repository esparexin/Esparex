/**
 * Catalog Brand & Model Controller
 * Handles brands and models together due to close relationship
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { respond, sendSuccessResponse } from '../../utils/respond';
import { handlePaginatedContent } from '../../utils/contentHandler';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import {
    BrandModel,
    CatalogModel,
    findCategoryBySlugForCatalog,
    findBrandByFilter,
    getActiveBrandIds,
    checkBrandInCategories,
    findActiveBrandByName,
    findPendingBrandSuggestion,
    createBrandRecord,
    findBrandByNameInCategory,
    checkBrandDependencies,
    findModelByFilter,
    findModelsByPattern,
    findModelSuggestion,
    findModelByNameAndBrand,
    createModelRecord,
    checkModelDependencies,
} from '../../services/catalog/CatalogBrandModelService';
import { validateBrandIsActive, validateCategoryIsActive } from '../../services/catalog/CatalogValidationService';
import { escapeRegExp } from '../../utils/stringUtils';
import CatalogOrchestrator from '../../services/catalog/CatalogOrchestrator';
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
    isDuplicateKeyError,
    sendEmptyPublicList
} from './shared';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import { validateBrandSuggestion, validateModelSuggestion } from '../../utils/suggestionValidation';
import {
    brandCreateSchema,
    brandUpdateSchema,
    modelCreateSchema,
    modelUpdateSchema,
    rejectionSchema
} from '../../validators/catalog.validator';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';
import { getCache, setCache } from '../../utils/redisCache';

// ── Cache helpers ──────────────────────────────────────────────────────────
const CATALOG_CACHE_TTL = 300; // 5 minutes
const catalogCacheKey = {
    brands: (categoryId: string) => `catalog:brands:${categoryId}`,
    models: (categoryId: string, brandId?: string) => brandId
        ? `catalog:models:${categoryId}:${brandId}`
        : `catalog:models:${categoryId}`,
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
    const categoryId = (req.query.categoryId || req.query.categoryIds) as string;
    let categoryObjectId: string | undefined = categoryId;
    if (!isAdminView && categoryId) {
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

    // Updated: filter brands by categoryIds (array)
    const categoryFilter = CategoryQueryBuilder.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();
    const adminCategoryFilter = CategoryQueryBuilder.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();

    if (!isAdminView) {
        logger.debug('[Catalog] getBrands query', { categoryId: categoryObjectId });

        // ── Redis cache (public path only) ────────────────────────────────────
        const cacheKey = catalogCacheKey.brands(categoryObjectId ?? 'all');
        const cached = await getCache<unknown>(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        applyCacheWriteThrough(res, cacheKey);
    }

    return handlePaginatedContent(req, res, BrandModel, {
        publicQuery: {
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ],
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
                    isActive: true,
                    isDeleted: { $ne: true },
                    $or: [
                        { status: CATALOG_STATUS.ACTIVE },
                        { status: { $exists: false } }
                    ]
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

        const brand = await findBrandByFilter({
            slug,
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
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
    return handleCatalogCreate(req, res, BrandModel as any, brandCreateSchema, {
        auditAction: 'BRAND_CREATE',
        slugifyName: true,
        preOp: async (payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;

            const categoryValidation = await validateActiveCategories((payload.categoryIds as string[]).map(String));
            if (!categoryValidation.ok) {
                throw new Error(`Invalid or inactive categories: ${categoryValidation.invalidCategoryIds.join(', ')}`);
            }
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Update existing brand
 */
export const updateBrand = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, BrandModel as any, brandUpdateSchema, {
        auditAction: 'BRAND_RENAME',
        preUpdate: async (_id, payload, oldBrand) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;

            const nextCategoryIds = payload.categoryIds ? (payload.categoryIds as string[]).map(String) : ((oldBrand as any).categoryIds || []).map(String);
            const categoryValidation = await validateActiveCategories(nextCategoryIds);
            if (!categoryValidation.ok) {
                throw new Error(`Invalid or inactive categories: ${categoryValidation.invalidCategoryIds.join(', ')}`);
            }
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Toggle brand active status
 */
export const toggleBrandStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, BrandModel as any, {
        auditAction: 'TOGGLE_BRAND_STATUS',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Delete brand (soft delete with dependency check)
 */
export const deleteBrand = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, BrandModel as any, checkBrandDependencies, {
        auditAction: 'BRAND_DELETE',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Suggest a new brand (User interaction)
 */
export const suggestBrand = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?._id;
        if (!userId) { return sendContractErrorResponse(req, res, 401, 'Authentication required'); }

        const { name, categoryIds } = req.body;
        const validation = validateBrandSuggestion(name || '');
        if (!validation.isValid) return sendCatalogError(req, res, validation.error || 'Invalid name', 400);

        if (!categoryIds || !mongoose.Types.ObjectId.isValid(categoryIds)) {
            return sendCatalogError(req, res, 'Valid categoryIds is required', 400);
        }
        const { ok: catOk } = await validateCategoryIsActive(categoryIds);
        if (!catOk) {
            return sendCatalogError(req, res, 'categoryIds must reference an active category', 400);
        }

        const cleanName = validation.cleanName;

        // Check for existing active brand
        const existing = await findActiveBrandByName(new RegExp(`^${escapeRegExp(cleanName)}$`, 'i'));

        if (existing) {
            const typedExisting = existing as { _id: unknown; categoryIds?: unknown };
            const alreadyHasCategory = String(typedExisting.categoryIds) === categoryIds;

            if (alreadyHasCategory) {
                // Brand is active and already covers this category — user should select from dropdown
                return sendCatalogError(req, res, `"${cleanName}" already exists in this category. Select it from the dropdown.`, 409);
            }

            // Brand is already admin-approved in another category.
            // Under the new taxonomy model, a Brand strictly belongs to ONE category.
            // If they suggest the same name in a different category, we must create a new record.
            // Let it fall through to create a new Brand record.
        }

        // Check for pending from same user
        const alreadyPending = await findPendingBrandSuggestion(
            new RegExp(`^${escapeRegExp(cleanName)}$`, 'i'),
            categoryIds,
            userId
        );

        if (alreadyPending) {
            return sendCatalogError(req, res, 'You already have a pending suggestion for this brand.', 409);
        }

        const brand = await createBrandRecord({
            name: cleanName,
            slug: slugify(cleanName, { lower: true, strict: true, trim: true }) + '-' + nanoid(5),
            categoryIds: [categoryIds],
            status: CATALOG_STATUS.PENDING,
            isActive: false,
            suggestedBy: userId
        });

        await CatalogOrchestrator.invalidateCatalogCache();

        res.status(201).json(respond({
            success: true,
            message: 'Brand suggestion submitted for review.',
            data: brand
        }));
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendCatalogError(req, res, new Error(`"${req.body?.name || 'Brand'}" already exists. Select it from the dropdown.`), { statusCode: 409 });
        }
        return sendCatalogError(req, res, error);
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
    const brandObjectId = typeof brandId === 'string' ? brandId : undefined;
    const categoryId = req.query.categoryId as string;

    let categoryObjectId: string | undefined = categoryId;
    if (!isAdminView && categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const cat = await findCategoryBySlugForCatalog(categoryId, ACTIVE_CATEGORY_QUERY);
            if (cat) categoryObjectId = cat._id.toString();
        }
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
    if (brandId) adminQuery.brandId = brandId;
    if (categoryId) {
        Object.assign(adminQuery, CategoryQueryBuilder.forSingular().withFilters({ categoryId }).build());
    }

    const publicQuery: QueryRecord = {
        isDeleted: { $ne: true },
        $or: [
            { status: CATALOG_STATUS.ACTIVE, isActive: true },
            { status: CATALOG_STATUS.PENDING }
        ]
    };
    if (!isAdminView) {
        publicQuery.categoryId = { $in: activeCategoryIds };
        publicQuery.brandId = { $in: activeBrandIds };
    }
    if (brandObjectId) publicQuery.brandId = brandObjectId;
    if (categoryObjectId) {
        Object.assign(publicQuery, CategoryQueryBuilder.forSingular().withFilters({ categoryId: categoryObjectId }).build());
    }

    if (!isAdminView && brandObjectId) {
        const brandExists = await checkBrandInCategories(brandObjectId, activeCategoryIds);
        if (!brandExists) {
            return sendEmptyPublicList(res);
        }
    }

    // ── Redis cache (public path only) ─────────────────────────────────────
    if (!isAdminView) {
        const cacheKey = catalogCacheKey.models(categoryObjectId ?? 'all', brandObjectId);
        const cached = await getCache<unknown>(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        applyCacheWriteThrough(res, cacheKey);
    }

    return handlePaginatedContent(req, res, CatalogModel, {
        populate: isAdminView ? undefined : 'brandId categoryIds',
        adminQuery,
        publicQuery,
        searchFields: ['name']
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
                    isActive: true,
                    isDeleted: { $ne: true },
                    $or: [
                        { status: CATALOG_STATUS.ACTIVE },
                        { status: { $exists: false } }
                    ]
                })
        });
        if (!model) return sendCatalogError(req, res, 'Model not found', 404);
        sendSuccessResponse(res, model);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Get single public model by slug.
 * Models do not persist a dedicated slug, so we resolve against the canonicalized name.
 */
export const getModelBySlug = async (req: Request, res: Response) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) {
            return sendCatalogError(req, res, 'Model slug is required', 400);
        }

        const humanizedSlug = slug.replace(/-/g, ' ');
        const slugPattern = new RegExp(
            `^${escapeRegExp(humanizedSlug).replace(/\s+/g, '[-\\s]+')}$`,
            'i'
        );

        const candidates = await findModelsByPattern(slugPattern, {
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ]
        });

        const matches = candidates.filter((candidate) =>
            slugify(candidate.name || '', { lower: true, strict: true, trim: true }) === slug
        );

        if (matches.length === 0) {
            return sendCatalogError(req, res, 'Model not found', 404);
        }

        if (matches.length > 1) {
            return sendCatalogError(req, res, 'Model slug is ambiguous', 409);
        }

        sendSuccessResponse(res, matches[0]);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new model
 */
export const createModel = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, CatalogModel as any, modelCreateSchema, {
        auditAction: 'MODEL_CREATE',
        preOp: async (payload) => {
            // Auto-derive categoryId if missing
            if (!payload.categoryId) {
                const derivedId = await CatalogOrchestrator.resolveCategoryIdFromBrand(payload.brandId);
                if (!derivedId) throw new Error('Invalid brandId: cannot resolve parent category');
                payload.categoryId = derivedId.toString();
            }

            // Sync categoryId <-> categoryIds
            if (payload.categoryId && (!payload.categoryIds || payload.categoryIds.length === 0)) {
                payload.categoryIds = [payload.categoryId];
            } else if (payload.categoryIds && payload.categoryIds.length > 0 && !payload.categoryId) {
                payload.categoryId = payload.categoryIds[0];
            }

            const { ok, reason } = await validateBrandIsActive(payload.brandId);
            if (!ok) throw new Error(reason || 'brandId must reference an active, non-deleted brand');
            
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Update existing model
 */
export const updateModel = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, CatalogModel as any, modelUpdateSchema, {
        auditAction: 'MODEL_RENAME',
        preUpdate: async (_id, payload) => {
            if (payload.brandId) {
                const { ok, reason } = await validateBrandIsActive(payload.brandId);
                if (!ok) throw new Error(reason || 'brandId must reference an active, non-deleted brand');
            }
            // Sync categoryId <-> categoryIds
            if (payload.categoryId && (!payload.categoryIds || payload.categoryIds.length === 0)) {
                payload.categoryIds = [payload.categoryId];
            } else if (payload.categoryIds && payload.categoryIds.length > 0) {
                payload.categoryId = payload.categoryIds[0];
            }
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Toggle model active status
 */
export const toggleModelStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, CatalogModel as any, {
        auditAction: 'TOGGLE_MODEL_STATUS',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Delete model (soft delete with dependency check)
 */
export const deleteModel = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, CatalogModel as any, checkModelDependencies, {
        auditAction: 'MODEL_DELETE',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Approve pending brand
 */
export const approveBrand = (req: Request, res: Response) =>
    handleCatalogReview(req, res, BrandModel as any, 'APPROVE', undefined, {
        auditAction: 'APPROVE_BRAND',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });

/**
 * Reject pending brand
 */
export const rejectBrand = (req: Request, res: Response) =>
    handleCatalogReview(req, res, BrandModel as any, 'REJECT', rejectionSchema, {
        auditAction: 'REJECT_BRAND',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });

/**
 * Approve pending model
 */
export const approveModel = (req: Request, res: Response) =>
    handleCatalogReview(req, res, CatalogModel as any, 'APPROVE', undefined, {
        auditAction: 'APPROVE_MODEL',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });

/**
 * Reject pending model
 */
export const rejectModel = (req: Request, res: Response) =>
    handleCatalogReview(req, res, CatalogModel as any, 'REJECT', rejectionSchema, {
        auditAction: 'REJECT_MODEL',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });

/**
 * Suggest a new model (User interaction)
 */
export const suggestModel = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?._id;
        if (!userId) { return sendContractErrorResponse(req, res, 401, 'Authentication required'); }

        const { name, brandId } = req.body;
        const validation = validateModelSuggestion(name || '');
        if (!validation.isValid) return sendCatalogError(req, res, validation.error || 'Invalid name', 400);

        if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
            return sendCatalogError(req, res, 'Valid brandId is required', 400);
        }

        const { ok: brandOk } = await validateBrandIsActive(brandId);
        if (!brandOk) {
            return sendCatalogError(req, res, 'brandId must reference an active brand', 400);
        }

        const cleanName = validation.cleanName;

        // Check if model already exists (Active or Pending) regardless of who suggested it
        const existing = await findModelSuggestion(
            new RegExp(`^${escapeRegExp(cleanName)}$`, 'i'),
            brandId
        );

        if (existing) {
            return res.status(200).json(respond({
                success: true,
                message: existing.status === CATALOG_STATUS.ACTIVE 
                    ? `"${cleanName}" already exists and is active.` 
                    : `"${cleanName}" is already suggested and awaiting approval.`,
                data: existing
            }));
        }

        const model = await createModelRecord({
            name: cleanName,
            brandId,
            status: CATALOG_STATUS.PENDING,
            isActive: false,
            suggestedBy: userId
        });

        await CatalogOrchestrator.invalidateCatalogCache();

        res.status(201).json(respond({
            success: true,
            message: 'Model suggestion submitted for review.',
            data: model
        }));
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendCatalogError(req, res, `"${req.body?.name || 'Model'}" already exists. Select it from the dropdown.`, 409);
        }
        return sendCatalogError(req, res, error);
    }
};

/**
 * Ensure model exists (create brand + model if needed)
 */
export const ensureModel = async (req: Request, res: Response) => {
    try {
        const { categoryId, brandName, modelName } = req.body;
        const userId = (req as any).user?.id || (req as any).user?._id;

        if (!categoryId || !brandName || !modelName) {
            return sendCatalogError(req, res, 'Missing fields', 400);
        }
        const { ok: catOk } = await validateCategoryIsActive(categoryId);
        if (!catOk) {
            return sendCatalogError(req, res, 'categoryId must reference an active category', 400);
        }

        // Optimistically search for Brand and any Model with that name under it
        const brandRegex = new RegExp(`^${escapeRegExp(brandName)}$`, 'i');
        const modelRegex = new RegExp(`^${escapeRegExp(modelName)}$`, 'i');

        let brand = await findBrandByNameInCategory(brandRegex, categoryId);
        if (!brand) {
            const brandVal = validateBrandSuggestion(brandName);
            brand = await createBrandRecord({
                name: brandVal.cleanName || brandName,
                slug: slugify(brandVal.cleanName || brandName, { lower: true, strict: true, trim: true }) + '-' + nanoid(5),
                categoryIds: [categoryId],
                isActive: false,
                status: CATALOG_STATUS.PENDING,
                suggestedBy: userId
            }) as any;
        }

        const brandId = String(brand!._id);
        let model = await findModelByNameAndBrand(modelRegex, brandId);

        if (!model) {
            const modelVal = validateModelSuggestion(modelName);
            model = await createModelRecord({
                name: modelVal.cleanName || modelName,
                brandId: brand!._id,
                categoryIds: [categoryId],
                isActive: false,
                status: CATALOG_STATUS.PENDING,
                suggestedBy: userId
            }) as any;
        }

        await CatalogOrchestrator.invalidateCatalogCache();

        res.status(201).json(respond({ success: true, data: model }));
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};
