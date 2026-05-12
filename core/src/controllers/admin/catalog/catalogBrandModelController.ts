/**
 * Catalog Brand & Model Controller
 * Handles brands and models together due to close relationship
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import { respond, sendSuccessResponse } from "../../../utils/respond";
import { handlePaginatedContent } from "../../../utils/contentHandler";
import mongoose from 'mongoose';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { TAXONOMY_APPROVAL_STATUS } from "../../../constants/enums/taxonomyApprovalStatus";
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
    findModelSuggestion,
    findModelByNameAndBrand,
    createModelRecord,
    checkModelDependencies,
    findModelBySlug,
} from '../../../services/catalog/CatalogBrandModelService';
import { validateBrandIsActive, validateCategoryIsActive } from '../../../services/catalog/CatalogValidationService';
import { escapeRegExp } from '../../../utils/stringUtils';
import CatalogOrchestrator from '../../../services/catalog/CatalogOrchestrator';
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
    sendEmptyPublicList,
    applyTaxonomyStatusFilter,
} from './shared';
import { toOptionalString, toStringArray } from './inputCoercion';
import { sendErrorResponse as sendContractErrorResponse } from "../../../utils/errorResponse";
import { validateBrandSuggestion, validateModelSuggestion } from '../../../utils/suggestionValidation';
export { validateBrandSuggestion, validateModelSuggestion };
import {
    brandCreateSchema,
    brandUpdateSchema,
    modelCreateSchema,
    modelUpdateSchema,
    rejectionSchema
} from '../../../validators/catalog.validator';
import CategoryQueryBuilder from '../../../utils/CategoryQueryBuilder';
import { getCache, setCache } from '../../../utils/redisCache';
import { TAXONOMY_PUBLIC_VISIBILITY_QUERY, deriveApprovalStatus, isDuplicateSuggestion } from '../../../services/catalog/taxonomySsot';
import { CatalogNotificationService } from '../../../services/catalog/CatalogNotificationService';
import { TaxonomyAiService } from '../../../services/catalog/taxonomyAiService';

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
    const categoryId = req.query.categoryId as string;
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
    applyTaxonomyStatusFilter(adminCategoryFilter, rawStatus);

    return handlePaginatedContent(req, res, BrandModel, {
        publicQuery: {
            ...TAXONOMY_PUBLIC_VISIBILITY_QUERY,
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
                    ...TAXONOMY_PUBLIC_VISIBILITY_QUERY,
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
            ...TAXONOMY_PUBLIC_VISIBILITY_QUERY,
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
            const approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus,
                isActive: payload.isActive,
                fallback: TAXONOMY_APPROVAL_STATUS.APPROVED,
            });
            payload.approvalStatus = approvalStatus;

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
    return handleCatalogUpdate(req, res, BrandModel, brandUpdateSchema, {
        auditAction: 'BRAND_RENAME',
        preUpdate: async (_id, payload, oldBrand) => {
            const typedOldBrand = oldBrand as { categoryIds?: unknown[]; approvalStatus?: unknown; isActive?: boolean };
            payload.approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus ?? typedOldBrand.approvalStatus,
                isActive: payload.isActive ?? typedOldBrand.isActive,
                fallback: TAXONOMY_APPROVAL_STATUS.APPROVED,
            });

            const nextCategoryIds = payload.categoryIds ? (payload.categoryIds as string[]).map(String) : (typedOldBrand.categoryIds || []).map(String);
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
    return handleCatalogToggleStatus(req, res, BrandModel, {
        auditAction: 'TOGGLE_BRAND_STATUS',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Delete brand (soft delete with dependency check)
 */
export const deleteBrand = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, BrandModel, checkBrandDependencies, {
        auditAction: 'BRAND_DELETE',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Suggest a new brand (User interaction)
 */
export const suggestBrand = async (req: Request, res: Response) => {
    try {
        const userId = (req as { user?: { id?: string; _id?: string } }).user?.id || (req as { user?: { id?: string; _id?: string } }).user?._id;
        if (!userId) { return sendContractErrorResponse(req, res, 401, 'Authentication required'); }

        const { name, categoryIds } = req.body as { name?: string; categoryIds?: string };
        const validation = validateBrandSuggestion(name ?? '');
        if (!validation.isValid) return sendCatalogError(req, res, validation.error || 'Invalid name', 400);

        if (!categoryIds || !mongoose.Types.ObjectId.isValid(categoryIds)) {
            return sendCatalogError(req, res, 'Valid categoryIds is required', 400);
        }
        const { ok: catOk } = await validateCategoryIsActive(categoryIds);
        if (!catOk) {
            return sendCatalogError(req, res, 'categoryIds must reference an active category', 400);
        }

        const cleanName = validation.cleanName;

        // Check for existing active brand (Exact match)
        const existing = await findActiveBrandByName(new RegExp(`^${escapeRegExp(cleanName)}$`, 'i'));

        if (existing) {
            const typedExisting = existing as { _id: unknown; categoryIds?: unknown };
            const alreadyHasCategory = String(typedExisting.categoryIds) === categoryIds;

            if (alreadyHasCategory) {
                // Brand is active and already covers this category — user should select from dropdown
                return sendCatalogError(req, res, `"${cleanName}" already exists in this category. Select it from the dropdown.`, 409);
            }
        }

        // Advanced fuzzy duplicate detection (Phase 4)
        const allBrands = await BrandModel.find({ isDeleted: false }, 'name aliases canonicalName');
        const duplicateCheck = isDuplicateSuggestion(cleanName, allBrands as any);

        if (duplicateCheck.isDuplicate && duplicateCheck.confidence < 1.0) {
            return res.status(200).json(respond({
                success: true,
                message: `"${cleanName}" is very similar to existing brand "${duplicateCheck.matchedWith}". Please use that instead.`,
                data: { match: duplicateCheck.matchedWith, confidence: duplicateCheck.confidence }
            }));
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

        const aiResult = await TaxonomyAiService.analyzeBrand(cleanName);

        const brand = await createBrandRecord({
            name: cleanName,
            slug: slugify(cleanName, { lower: true, strict: true, trim: true }) + '-' + nanoid(5),
            categoryIds: [categoryIds],
            approvalStatus: TAXONOMY_APPROVAL_STATUS.PENDING,
            isActive: false,
            suggestedBy: userId,
            aiAnalysis: aiResult?.analysis,
            aiDecision: aiResult?.decision
        });

        if (brand.approvalStatus === TAXONOMY_APPROVAL_STATUS.PENDING) {
            void CatalogNotificationService.notifyAdminsOfSuggestion('brand', cleanName, String(userId));
        }

        await CatalogOrchestrator.invalidateCatalogCache();

        res.status(201).json(respond({
            success: true,
            message: 'Brand suggestion submitted for review.',
            data: brand
        }));
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendCatalogError(req, res, new Error(`"${(req.body as { name?: string })?.name ?? 'Brand'}" already exists. Select it from the dropdown.`), { statusCode: 409 });
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
    const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;

    let categoryObjectId: string | undefined = categoryId;
    if (!isAdminView && categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const cat = await findCategoryBySlugForCatalog(categoryId, ACTIVE_CATEGORY_QUERY);
            if (cat) categoryObjectId = cat._id.toString();
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
    if (brandId) adminQuery.brandId = brandObjectId;
    if (categoryId) {
        Object.assign(adminQuery, CategoryQueryBuilder.forPlural().withFilters({ categoryIds: [categoryId] }).build());
    }
    applyTaxonomyStatusFilter(adminQuery, rawStatus);

    const publicQuery: QueryRecord = {
        ...TAXONOMY_PUBLIC_VISIBILITY_QUERY,
    };
    if (!isAdminView) {
        Object.assign(publicQuery, CategoryQueryBuilder.forPlural().withFilters({ categoryIds: activeCategoryIds }).build());
        publicQuery.brandId = { $in: activeBrandIds };
    }
    if (brandObjectId) publicQuery.brandId = brandObjectId;
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
    delete queryParams.status;

    return handlePaginatedContent(req, res, CatalogModel, {
        populate: isAdminView ? undefined : 'brandId categoryIds',
        adminQuery,
        publicQuery,
        searchFields: ['name'],
        queryParams,
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
                    ...TAXONOMY_PUBLIC_VISIBILITY_QUERY,
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
        const baseFilter = { ...TAXONOMY_PUBLIC_VISIBILITY_QUERY };

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
                if (!derivedId) throw new Error('Invalid brandId: cannot resolve parent category');
                payload.categoryIds = [derivedId.toString()];
            } else {
                payload.categoryIds = categoryIds;
            }

            if (!brandId) throw new Error('brandId is required');
            payload.brandId = brandId;
            const { ok, reason } = await validateBrandIsActive(brandId);
            if (!ok) throw new Error(reason || 'brandId must reference an active, non-deleted brand');

            payload.approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus,
                isActive: payload.isActive,
                fallback: TAXONOMY_APPROVAL_STATUS.APPROVED,
            });
            
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
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
            } else if ((existingModel as { categoryIds?: unknown[] }).categoryIds) {
                payload.categoryIds = ((existingModel as { categoryIds?: unknown[] }).categoryIds || []).map(String);
            }

            const typedExisting = existingModel as { approvalStatus?: unknown; isActive?: boolean };
            payload.approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus ?? typedExisting.approvalStatus,
                isActive: payload.isActive ?? typedExisting.isActive,
                fallback: TAXONOMY_APPROVAL_STATUS.APPROVED,
            });
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Toggle model active status
 */
export const toggleModelStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, CatalogModel, {
        auditAction: 'TOGGLE_MODEL_STATUS',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Delete model (soft delete with dependency check)
 */
export const deleteModel = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, CatalogModel, checkModelDependencies, {
        auditAction: 'MODEL_DELETE',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Approve pending brand
 */
export const approveBrand = (req: Request, res: Response) =>
    handleCatalogReview(req, res, BrandModel, 'APPROVE', undefined, {
        auditAction: 'APPROVE_BRAND',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });

/**
 * Reject pending brand
 */
export const rejectBrand = (req: Request, res: Response) =>
    handleCatalogReview(req, res, BrandModel, 'REJECT', rejectionSchema, {
        auditAction: 'REJECT_BRAND',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });

/**
 * Approve pending model
 */
export const approveModel = (req: Request, res: Response) =>
    handleCatalogReview(req, res, CatalogModel, 'APPROVE', undefined, {
        auditAction: 'APPROVE_MODEL',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });

/**
 * Reject pending model
 */
export const rejectModel = (req: Request, res: Response) =>
    handleCatalogReview(req, res, CatalogModel, 'REJECT', rejectionSchema, {
        auditAction: 'REJECT_MODEL',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });

/**
 * Suggest a new model (User interaction)
 */
export const suggestModel = async (req: Request, res: Response) => {
    try {
        const userId = (req as { user?: { id?: string; _id?: string } }).user?.id || (req as { user?: { id?: string; _id?: string } }).user?._id;
        if (!userId) { return sendContractErrorResponse(req, res, 401, 'Authentication required'); }

        const { name, brandId } = req.body as { name?: string; brandId?: string };
        const validation = validateModelSuggestion(name ?? '');
        if (!validation.isValid) return sendCatalogError(req, res, validation.error || 'Invalid name', 400);

        if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
            return sendCatalogError(req, res, 'Valid brandId is required', 400);
        }

        const { ok: brandOk } = await validateBrandIsActive(brandId);
        if (!brandOk) {
            return sendCatalogError(req, res, 'brandId must reference an active brand', 400);
        }

        const cleanName = validation.cleanName;

        // Check if model already exists (Exact match)
        const existing = await findModelSuggestion(
            new RegExp(`^${escapeRegExp(cleanName)}$`, 'i'),
            brandId
        );

        if (existing) {
            const existingApprovalStatus = (existing as { approvalStatus?: string }).approvalStatus;
            return res.status(200).json(respond({
                success: true,
                message: existingApprovalStatus === TAXONOMY_APPROVAL_STATUS.APPROVED
                    ? `"${cleanName}" already exists and is active.` 
                    : `"${cleanName}" is already suggested and awaiting approval.`,
                data: existing
            }));
        }

        // Advanced fuzzy duplicate detection (Phase 4)
        const allModels = await CatalogModel.find({ brandId, isDeleted: false }, 'name aliases canonicalName');
        const duplicateCheck = isDuplicateSuggestion(cleanName, allModels as any);

        if (duplicateCheck.isDuplicate && duplicateCheck.confidence < 1.0) {
            return res.status(200).json(respond({
                success: true,
                message: `"${cleanName}" is very similar to existing model "${duplicateCheck.matchedWith}". Please use that instead.`,
                data: { match: duplicateCheck.matchedWith, confidence: duplicateCheck.confidence }
            }));
        }

        const brandDoc = await BrandModel.findById(brandId);
        const aiResult = await TaxonomyAiService.analyzeModel(cleanName, brandDoc?.name);

        const model = await createModelRecord({
            name: cleanName,
            brandId,
            approvalStatus: TAXONOMY_APPROVAL_STATUS.PENDING,
            isActive: false,
            suggestedBy: userId,
            aiAnalysis: aiResult?.analysis,
            aiDecision: aiResult?.decision
        });

        if (model.approvalStatus === TAXONOMY_APPROVAL_STATUS.PENDING) {
            void CatalogNotificationService.notifyAdminsOfSuggestion('model', cleanName, String(userId));
        }

        await CatalogOrchestrator.invalidateCatalogCache();

        res.status(201).json(respond({
            success: true,
            message: 'Model suggestion submitted for review.',
            data: model
        }));
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendCatalogError(req, res, `"${(req.body as { name?: string })?.name ?? 'Model'}" already exists. Select it from the dropdown.`, 409);
        }
        return sendCatalogError(req, res, error);
    }
};

/**
 * Ensure model exists (create brand + model if needed)
 */
export const ensureModel = async (req: Request, res: Response) => {
    try {
        const { categoryId, brandName, modelName } = req.body as { categoryId?: string; brandName?: string; modelName?: string };
        const userId = (req as { user?: { id?: string; _id?: string } }).user?.id || (req as { user?: { id?: string; _id?: string } }).user?._id;

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
            const aiResult = await TaxonomyAiService.analyzeBrand(brandVal.cleanName || brandName);
            brand = await createBrandRecord({
                name: brandVal.cleanName || brandName,
                slug: slugify(brandVal.cleanName || brandName, { lower: true, strict: true, trim: true }) + '-' + nanoid(5),
                categoryIds: [categoryId],
                isActive: false,
                approvalStatus: TAXONOMY_APPROVAL_STATUS.PENDING,
                suggestedBy: userId,
                aiAnalysis: aiResult?.analysis,
                aiDecision: aiResult?.decision
            });
        }

        const brandId = String(brand._id);
        let model = await findModelByNameAndBrand(modelRegex, brandId);

        if (!model) {
            const modelVal = validateModelSuggestion(modelName);
            const aiResult = await TaxonomyAiService.analyzeModel(modelVal.cleanName || modelName, brand.name);
            model = await createModelRecord({
                name: modelVal.cleanName || modelName,
                brandId: brand._id,
                categoryIds: [categoryId],
                isActive: false,
                approvalStatus: TAXONOMY_APPROVAL_STATUS.PENDING,
                suggestedBy: userId,
                aiAnalysis: aiResult?.analysis,
                aiDecision: aiResult?.decision
            });
        }

        if ((brand as { approvalStatus?: string }).approvalStatus === TAXONOMY_APPROVAL_STATUS.PENDING) {
            void CatalogNotificationService.notifyAdminsOfSuggestion('brand', brandName, String(userId));
        }
        if ((model as { approvalStatus?: string }).approvalStatus === TAXONOMY_APPROVAL_STATUS.PENDING) {
            void CatalogNotificationService.notifyAdminsOfSuggestion('model', modelName, String(userId));
        }

        await CatalogOrchestrator.invalidateCatalogCache();

        res.status(201).json(respond({ success: true, data: model }));
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};
