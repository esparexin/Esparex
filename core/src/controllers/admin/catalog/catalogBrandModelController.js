"use strict";
/**
 * Catalog Brand & Model Controller
 * Handles brands and models together due to close relationship
 * Extracted from catalog.content.controller.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureModel = exports.suggestModel = exports.rejectModel = exports.approveModel = exports.rejectBrand = exports.approveBrand = exports.deleteModel = exports.toggleModelStatus = exports.updateModel = exports.createModel = exports.getModelBySlug = exports.getModelById = exports.getModels = exports.suggestBrand = exports.deleteBrand = exports.toggleBrandStatus = exports.updateBrand = exports.createBrand = exports.getBrandBySlug = exports.getBrandById = exports.getBrands = void 0;
const logger_1 = __importDefault(require("@esparex/core/utils/logger"));
const respond_1 = require("@esparex/core/utils/respond");
const contentHandler_1 = require("@esparex/core/utils/contentHandler");
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const nanoid_1 = require("nanoid");
const catalogStatus_1 = require("@esparex/shared/enums/catalogStatus");
const CatalogBrandModelService_1 = require("@esparex/core/services/catalog/CatalogBrandModelService");
const CatalogValidationService_1 = require("@esparex/core/services/catalog/CatalogValidationService");
const stringUtils_1 = require("@esparex/core/utils/stringUtils");
const CatalogOrchestrator_1 = __importDefault(require("@esparex/core/services/catalog/CatalogOrchestrator"));
const shared_1 = require("./shared");
const errorResponse_1 = require("@esparex/core/utils/errorResponse");
const suggestionValidation_1 = require("@esparex/core/utils/suggestionValidation");
const catalog_validator_1 = require("@esparex/core/validators/catalog.validator");
const CategoryQueryBuilder_1 = __importDefault(require("@esparex/core/utils/CategoryQueryBuilder"));
const redisCache_1 = require("@esparex/core/utils/redisCache");
// ── Cache helpers ──────────────────────────────────────────────────────────
const CATALOG_CACHE_TTL = 300; // 5 minutes
const catalogCacheKey = {
    brands: (categoryId) => `catalog:brands:${categoryId}`,
    models: (categoryId, brandId) => brandId
        ? `catalog:models:${categoryId}:${brandId}`
        : `catalog:models:${categoryId}`,
};
const toOptionalString = (value) => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || undefined;
    }
    if (value && typeof value === 'object' && typeof value.toString === 'function') {
        const stringValue = value.toString().trim();
        return stringValue && stringValue !== '[object Object]' ? stringValue : undefined;
    }
    return undefined;
};
const toStringArray = (value) => {
    if (!Array.isArray(value))
        return undefined;
    const normalized = value
        .map((entry) => toOptionalString(entry))
        .filter((entry) => Boolean(entry));
    return normalized.length > 0 ? normalized : undefined;
};
/** Wraps res.json to write-through to Redis on success (public path only). */
const applyCacheWriteThrough = (res, cacheKey) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            (0, redisCache_1.setCache)(cacheKey, body, CATALOG_CACHE_TTL).catch(() => { });
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
const getBrands = async (req, res) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const categoryId = (req.query.categoryId || req.query.categoryIds);
    let categoryObjectId = categoryId;
    if (!isAdminView && categoryId) {
        // Public view allows passing slug for categoryId
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            const cat = await (0, CatalogBrandModelService_1.findCategoryBySlugForCatalog)(categoryId, shared_1.ACTIVE_CATEGORY_QUERY);
            if (cat)
                categoryObjectId = cat._id.toString();
            else
                logger_1.default.debug('[Catalog] Category not found by slug (getBrands)', { categorySlug: categoryId });
        }
    }
    // Public view strictly requires categoryId
    if (!isAdminView && !categoryObjectId) {
        logger_1.default.debug('[Catalog] getBrands missing categoryId (public)', { providedId: categoryId });
        return (0, shared_1.sendCatalogError)(req, res, 'categoryId is required', 400);
    }
    if (!isAdminView) {
        // ── Redis cache (public path only) ────────────────────────────────────
        const cacheKey = catalogCacheKey.brands(categoryObjectId ?? 'all');
        const cached = await (0, redisCache_1.getCache)(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        applyCacheWriteThrough(res, cacheKey);
    }
    if (!isAdminView && categoryObjectId) {
        const activeCategoryValidation = await (0, shared_1.validateActiveCategories)([categoryObjectId]);
        if (!activeCategoryValidation.ok) {
            logger_1.default.debug('[Catalog] Category not active (getBrands)', { categoryId: categoryObjectId });
            return (0, shared_1.sendEmptyPublicList)(res);
        }
    }
    const queryParams = { ...req.query };
    delete queryParams.categoryId;
    delete queryParams.categoryIds;
    const categoryFilter = CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();
    const adminCategoryFilter = CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();
    return (0, contentHandler_1.handlePaginatedContent)(req, res, CatalogBrandModelService_1.BrandModel, {
        publicQuery: {
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ],
            ...categoryFilter
        },
        adminQuery: adminCategoryFilter,
        queryParams
    });
};
exports.getBrands = getBrands;
/**
 * Get single brand by ID
 */
const getBrandById = async (req, res) => {
    try {
        const isAdminView = req.originalUrl.includes('/admin');
        const brand = await (0, CatalogBrandModelService_1.findBrandByFilter)({
            _id: req.params.id,
            ...(isAdminView
                ? {}
                : {
                    isActive: true,
                    isDeleted: { $ne: true },
                    $or: [
                        { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
                        { status: { $exists: false } }
                    ]
                })
        });
        if (!brand)
            return (0, shared_1.sendCatalogError)(req, res, 'Brand not found', 404);
        (0, respond_1.sendSuccessResponse)(res, brand);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getBrandById = getBrandById;
/**
 * Get single public brand by slug
 */
const getBrandBySlug = async (req, res) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) {
            return (0, shared_1.sendCatalogError)(req, res, 'Brand slug is required', 400);
        }
        const brand = await (0, CatalogBrandModelService_1.findBrandByFilter)({
            slug,
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ]
        });
        if (!brand) {
            return (0, shared_1.sendCatalogError)(req, res, 'Brand not found', 404);
        }
        (0, respond_1.sendSuccessResponse)(res, brand);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getBrandBySlug = getBrandBySlug;
/**
 * Create new brand
 */
const createBrand = async (req, res) => {
    return (0, shared_1.handleCatalogCreate)(req, res, CatalogBrandModelService_1.BrandModel, catalog_validator_1.brandCreateSchema, {
        auditAction: 'BRAND_CREATE',
        slugifyName: true,
        preOp: async (payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;
            const categoryValidation = await (0, shared_1.validateActiveCategories)(payload.categoryIds.map(String));
            if (!categoryValidation.ok) {
                throw new Error(`Invalid or inactive categories: ${categoryValidation.invalidCategoryIds.join(', ')}`);
            }
            return payload;
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.createBrand = createBrand;
/**
 * Update existing brand
 */
const updateBrand = async (req, res) => {
    return (0, shared_1.handleCatalogUpdate)(req, res, CatalogBrandModelService_1.BrandModel, catalog_validator_1.brandUpdateSchema, {
        auditAction: 'BRAND_RENAME',
        preUpdate: async (_id, payload, oldBrand) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;
            const nextCategoryIds = payload.categoryIds ? payload.categoryIds.map(String) : (oldBrand.categoryIds || []).map(String);
            const categoryValidation = await (0, shared_1.validateActiveCategories)(nextCategoryIds);
            if (!categoryValidation.ok) {
                throw new Error(`Invalid or inactive categories: ${categoryValidation.invalidCategoryIds.join(', ')}`);
            }
            return payload;
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.updateBrand = updateBrand;
/**
 * Toggle brand active status
 */
const toggleBrandStatus = async (req, res) => {
    return (0, shared_1.handleCatalogToggleStatus)(req, res, CatalogBrandModelService_1.BrandModel, {
        auditAction: 'TOGGLE_BRAND_STATUS',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.toggleBrandStatus = toggleBrandStatus;
/**
 * Delete brand (soft delete with dependency check)
 */
const deleteBrand = async (req, res) => {
    return (0, shared_1.handleCatalogDelete)(req, res, CatalogBrandModelService_1.BrandModel, CatalogBrandModelService_1.checkBrandDependencies, {
        auditAction: 'BRAND_DELETE',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.deleteBrand = deleteBrand;
/**
 * Suggest a new brand (User interaction)
 */
const suggestBrand = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Authentication required');
        }
        const { name, categoryIds } = req.body;
        const validation = (0, suggestionValidation_1.validateBrandSuggestion)(name ?? '');
        if (!validation.isValid)
            return (0, shared_1.sendCatalogError)(req, res, validation.error || 'Invalid name', 400);
        if (!categoryIds || !mongoose_1.default.Types.ObjectId.isValid(categoryIds)) {
            return (0, shared_1.sendCatalogError)(req, res, 'Valid categoryIds is required', 400);
        }
        const { ok: catOk } = await (0, CatalogValidationService_1.validateCategoryIsActive)(categoryIds);
        if (!catOk) {
            return (0, shared_1.sendCatalogError)(req, res, 'categoryIds must reference an active category', 400);
        }
        const cleanName = validation.cleanName;
        // Check for existing active brand
        const existing = await (0, CatalogBrandModelService_1.findActiveBrandByName)(new RegExp(`^${(0, stringUtils_1.escapeRegExp)(cleanName)}$`, 'i'));
        if (existing) {
            const typedExisting = existing;
            const alreadyHasCategory = String(typedExisting.categoryIds) === categoryIds;
            if (alreadyHasCategory) {
                // Brand is active and already covers this category — user should select from dropdown
                return (0, shared_1.sendCatalogError)(req, res, `"${cleanName}" already exists in this category. Select it from the dropdown.`, 409);
            }
            // Brand is already admin-approved in another category.
            // Under the new taxonomy model, a Brand strictly belongs to ONE category.
            // If they suggest the same name in a different category, we must create a new record.
            // Let it fall through to create a new Brand record.
        }
        // Check for pending from same user
        const alreadyPending = await (0, CatalogBrandModelService_1.findPendingBrandSuggestion)(new RegExp(`^${(0, stringUtils_1.escapeRegExp)(cleanName)}$`, 'i'), categoryIds, userId);
        if (alreadyPending) {
            return (0, shared_1.sendCatalogError)(req, res, 'You already have a pending suggestion for this brand.', 409);
        }
        const brand = await (0, CatalogBrandModelService_1.createBrandRecord)({
            name: cleanName,
            slug: (0, slugify_1.default)(cleanName, { lower: true, strict: true, trim: true }) + '-' + (0, nanoid_1.nanoid)(5),
            categoryIds: [categoryIds],
            status: catalogStatus_1.CATALOG_STATUS.PENDING,
            isActive: false,
            suggestedBy: userId
        });
        await CatalogOrchestrator_1.default.invalidateCatalogCache();
        res.status(201).json((0, respond_1.respond)({
            success: true,
            message: 'Brand suggestion submitted for review.',
            data: brand
        }));
    }
    catch (error) {
        if ((0, shared_1.isDuplicateKeyError)(error)) {
            return (0, shared_1.sendCatalogError)(req, res, new Error(`"${req.body?.name ?? 'Brand'}" already exists. Select it from the dropdown.`), { statusCode: 409 });
        }
        return (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.suggestBrand = suggestBrand;
/* ==========================================================
   MODELS
   ========================================================== */
/**
 * Get all models (with optional brand/category filters)
 */
const getModels = async (req, res) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const { brandId } = req.query;
    const brandObjectId = typeof brandId === 'string' ? brandId : undefined;
    const categoryId = req.query.categoryId;
    let categoryObjectId = categoryId;
    if (!isAdminView && categoryId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            const cat = await (0, CatalogBrandModelService_1.findCategoryBySlugForCatalog)(categoryId, shared_1.ACTIVE_CATEGORY_QUERY);
            if (cat)
                categoryObjectId = cat._id.toString();
        }
    }
    // ── Redis cache (public path only) ─────────────────────────────────────
    if (!isAdminView) {
        const cacheKey = catalogCacheKey.models(categoryObjectId ?? 'all', brandObjectId);
        const cached = await (0, redisCache_1.getCache)(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        applyCacheWriteThrough(res, cacheKey);
    }
    if (!isAdminView && categoryObjectId) {
        const activeCategoryValidation = await (0, shared_1.validateActiveCategories)([categoryObjectId]);
        if (!activeCategoryValidation.ok) {
            return (0, shared_1.sendEmptyPublicList)(res);
        }
    }
    let activeCategoryIds = [];
    if (!isAdminView) {
        activeCategoryIds = categoryObjectId ? [categoryObjectId] : await (0, shared_1.getActiveCategoryIds)();
        if (activeCategoryIds.length === 0) {
            return (0, shared_1.sendEmptyPublicList)(res);
        }
    }
    const activeBrandIds = !isAdminView
        ? await (0, CatalogBrandModelService_1.getActiveBrandIds)(activeCategoryIds)
        : [];
    if (!isAdminView && activeBrandIds.length === 0) {
        return (0, shared_1.sendEmptyPublicList)(res);
    }
    const adminQuery = {};
    if (brandId)
        adminQuery.brandId = brandObjectId;
    if (categoryId) {
        Object.assign(adminQuery, CategoryQueryBuilder_1.default.forSingular().withFilters({ categoryId }).build());
    }
    const publicQuery = {
        isDeleted: { $ne: true },
        $or: [
            { status: catalogStatus_1.CATALOG_STATUS.ACTIVE, isActive: true },
            { status: catalogStatus_1.CATALOG_STATUS.PENDING }
        ]
    };
    if (!isAdminView) {
        publicQuery.categoryId = { $in: activeCategoryIds };
        publicQuery.brandId = { $in: activeBrandIds };
    }
    if (brandObjectId)
        publicQuery.brandId = brandObjectId;
    if (categoryObjectId) {
        Object.assign(publicQuery, CategoryQueryBuilder_1.default.forSingular().withFilters({ categoryId: categoryObjectId }).build());
    }
    if (!isAdminView && brandObjectId) {
        const brandExists = await (0, CatalogBrandModelService_1.checkBrandInCategories)(brandObjectId, activeCategoryIds);
        if (!brandExists) {
            return (0, shared_1.sendEmptyPublicList)(res);
        }
    }
    return (0, contentHandler_1.handlePaginatedContent)(req, res, CatalogBrandModelService_1.CatalogModel, {
        populate: isAdminView ? undefined : 'brandId categoryIds',
        adminQuery,
        publicQuery,
        searchFields: ['name']
    });
};
exports.getModels = getModels;
/**
 * Get single model by ID
 */
const getModelById = async (req, res) => {
    try {
        const isAdminView = req.originalUrl.includes('/admin');
        const model = await (0, CatalogBrandModelService_1.findModelByFilter)({
            _id: req.params.id,
            ...(isAdminView
                ? {}
                : {
                    isActive: true,
                    isDeleted: { $ne: true },
                    $or: [
                        { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
                        { status: { $exists: false } }
                    ]
                })
        });
        if (!model)
            return (0, shared_1.sendCatalogError)(req, res, 'Model not found', 404);
        (0, respond_1.sendSuccessResponse)(res, model);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getModelById = getModelById;
/**
 * Get single public model by slug.
 * Models do not persist a dedicated slug, so we resolve against the canonicalized name.
 */
const getModelBySlug = async (req, res) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) {
            return (0, shared_1.sendCatalogError)(req, res, 'Model slug is required', 400);
        }
        const humanizedSlug = slug.replace(/-/g, ' ');
        const slugPattern = new RegExp(`^${(0, stringUtils_1.escapeRegExp)(humanizedSlug).replace(/\s+/g, '[-\\s]+')}$`, 'i');
        const candidates = await (0, CatalogBrandModelService_1.findModelsByPattern)(slugPattern, {
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ]
        });
        const matches = candidates.filter((candidate) => (0, slugify_1.default)(candidate.name || '', { lower: true, strict: true, trim: true }) === slug);
        if (matches.length === 0) {
            return (0, shared_1.sendCatalogError)(req, res, 'Model not found', 404);
        }
        if (matches.length > 1) {
            return (0, shared_1.sendCatalogError)(req, res, 'Model slug is ambiguous', 409);
        }
        (0, respond_1.sendSuccessResponse)(res, matches[0]);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getModelBySlug = getModelBySlug;
/**
 * Create new model
 */
const createModel = async (req, res) => {
    return (0, shared_1.handleCatalogCreate)(req, res, CatalogBrandModelService_1.CatalogModel, catalog_validator_1.modelCreateSchema, {
        auditAction: 'MODEL_CREATE',
        preOp: async (payload) => {
            const brandId = toOptionalString(payload.brandId);
            const categoryId = toOptionalString(payload.categoryId);
            const categoryIds = toStringArray(payload.categoryIds);
            // Auto-derive categoryId if missing
            if (!categoryId) {
                if (!brandId)
                    throw new Error('brandId is required');
                const derivedId = await CatalogOrchestrator_1.default.resolveCategoryIdFromBrand(brandId);
                if (!derivedId)
                    throw new Error('Invalid brandId: cannot resolve parent category');
                payload.categoryId = derivedId.toString();
            }
            else {
                payload.categoryId = categoryId;
            }
            // Sync categoryId <-> categoryIds
            if (payload.categoryId && (!categoryIds || categoryIds.length === 0)) {
                payload.categoryIds = [String(payload.categoryId)];
            }
            else if (categoryIds && categoryIds.length > 0 && !payload.categoryId) {
                payload.categoryIds = categoryIds;
                payload.categoryId = categoryIds[0];
            }
            if (!brandId)
                throw new Error('brandId is required');
            payload.brandId = brandId;
            const { ok, reason } = await (0, CatalogValidationService_1.validateBrandIsActive)(brandId);
            if (!ok)
                throw new Error(reason || 'brandId must reference an active, non-deleted brand');
            return payload;
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.createModel = createModel;
/**
 * Update existing model
 */
const updateModel = async (req, res) => {
    return (0, shared_1.handleCatalogUpdate)(req, res, CatalogBrandModelService_1.CatalogModel, catalog_validator_1.modelUpdateSchema, {
        auditAction: 'MODEL_RENAME',
        preUpdate: async (_id, payload) => {
            const brandId = toOptionalString(payload.brandId);
            const categoryId = toOptionalString(payload.categoryId);
            const categoryIds = toStringArray(payload.categoryIds);
            if (payload.brandId !== undefined && !brandId) {
                throw new Error('brandId must be a valid string');
            }
            if (brandId) {
                payload.brandId = brandId;
                const { ok, reason } = await (0, CatalogValidationService_1.validateBrandIsActive)(brandId);
                if (!ok)
                    throw new Error(reason || 'brandId must reference an active, non-deleted brand');
            }
            // Sync categoryId <-> categoryIds
            if (categoryId) {
                payload.categoryId = categoryId;
            }
            if (payload.categoryId && (!categoryIds || categoryIds.length === 0)) {
                payload.categoryIds = [String(payload.categoryId)];
            }
            else if (categoryIds && categoryIds.length > 0) {
                payload.categoryIds = categoryIds;
                payload.categoryId = categoryIds[0];
            }
            return payload;
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.updateModel = updateModel;
/**
 * Toggle model active status
 */
const toggleModelStatus = async (req, res) => {
    return (0, shared_1.handleCatalogToggleStatus)(req, res, CatalogBrandModelService_1.CatalogModel, {
        auditAction: 'TOGGLE_MODEL_STATUS',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.toggleModelStatus = toggleModelStatus;
/**
 * Delete model (soft delete with dependency check)
 */
const deleteModel = async (req, res) => {
    return (0, shared_1.handleCatalogDelete)(req, res, CatalogBrandModelService_1.CatalogModel, CatalogBrandModelService_1.checkModelDependencies, {
        auditAction: 'MODEL_DELETE',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.deleteModel = deleteModel;
/**
 * Approve pending brand
 */
const approveBrand = (req, res) => (0, shared_1.handleCatalogReview)(req, res, CatalogBrandModelService_1.BrandModel, 'APPROVE', undefined, {
    auditAction: 'APPROVE_BRAND',
    postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
});
exports.approveBrand = approveBrand;
/**
 * Reject pending brand
 */
const rejectBrand = (req, res) => (0, shared_1.handleCatalogReview)(req, res, CatalogBrandModelService_1.BrandModel, 'REJECT', catalog_validator_1.rejectionSchema, {
    auditAction: 'REJECT_BRAND',
    postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
});
exports.rejectBrand = rejectBrand;
/**
 * Approve pending model
 */
const approveModel = (req, res) => (0, shared_1.handleCatalogReview)(req, res, CatalogBrandModelService_1.CatalogModel, 'APPROVE', undefined, {
    auditAction: 'APPROVE_MODEL',
    postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
});
exports.approveModel = approveModel;
/**
 * Reject pending model
 */
const rejectModel = (req, res) => (0, shared_1.handleCatalogReview)(req, res, CatalogBrandModelService_1.CatalogModel, 'REJECT', catalog_validator_1.rejectionSchema, {
    auditAction: 'REJECT_MODEL',
    postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
});
exports.rejectModel = rejectModel;
/**
 * Suggest a new model (User interaction)
 */
const suggestModel = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Authentication required');
        }
        const { name, brandId } = req.body;
        const validation = (0, suggestionValidation_1.validateModelSuggestion)(name ?? '');
        if (!validation.isValid)
            return (0, shared_1.sendCatalogError)(req, res, validation.error || 'Invalid name', 400);
        if (!brandId || !mongoose_1.default.Types.ObjectId.isValid(brandId)) {
            return (0, shared_1.sendCatalogError)(req, res, 'Valid brandId is required', 400);
        }
        const { ok: brandOk } = await (0, CatalogValidationService_1.validateBrandIsActive)(brandId);
        if (!brandOk) {
            return (0, shared_1.sendCatalogError)(req, res, 'brandId must reference an active brand', 400);
        }
        const cleanName = validation.cleanName;
        // Check if model already exists (Active or Pending) regardless of who suggested it
        const existing = await (0, CatalogBrandModelService_1.findModelSuggestion)(new RegExp(`^${(0, stringUtils_1.escapeRegExp)(cleanName)}$`, 'i'), brandId);
        if (existing) {
            return res.status(200).json((0, respond_1.respond)({
                success: true,
                message: existing.status === catalogStatus_1.CATALOG_STATUS.ACTIVE
                    ? `"${cleanName}" already exists and is active.`
                    : `"${cleanName}" is already suggested and awaiting approval.`,
                data: existing
            }));
        }
        const model = await (0, CatalogBrandModelService_1.createModelRecord)({
            name: cleanName,
            brandId,
            status: catalogStatus_1.CATALOG_STATUS.PENDING,
            isActive: false,
            suggestedBy: userId
        });
        await CatalogOrchestrator_1.default.invalidateCatalogCache();
        res.status(201).json((0, respond_1.respond)({
            success: true,
            message: 'Model suggestion submitted for review.',
            data: model
        }));
    }
    catch (error) {
        if ((0, shared_1.isDuplicateKeyError)(error)) {
            return (0, shared_1.sendCatalogError)(req, res, `"${req.body?.name ?? 'Model'}" already exists. Select it from the dropdown.`, 409);
        }
        return (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.suggestModel = suggestModel;
/**
 * Ensure model exists (create brand + model if needed)
 */
const ensureModel = async (req, res) => {
    try {
        const { categoryId, brandName, modelName } = req.body;
        const userId = req.user?.id || req.user?._id;
        if (!categoryId || !brandName || !modelName) {
            return (0, shared_1.sendCatalogError)(req, res, 'Missing fields', 400);
        }
        const { ok: catOk } = await (0, CatalogValidationService_1.validateCategoryIsActive)(categoryId);
        if (!catOk) {
            return (0, shared_1.sendCatalogError)(req, res, 'categoryId must reference an active category', 400);
        }
        // Optimistically search for Brand and any Model with that name under it
        const brandRegex = new RegExp(`^${(0, stringUtils_1.escapeRegExp)(brandName)}$`, 'i');
        const modelRegex = new RegExp(`^${(0, stringUtils_1.escapeRegExp)(modelName)}$`, 'i');
        let brand = await (0, CatalogBrandModelService_1.findBrandByNameInCategory)(brandRegex, categoryId);
        if (!brand) {
            const brandVal = (0, suggestionValidation_1.validateBrandSuggestion)(brandName);
            brand = await (0, CatalogBrandModelService_1.createBrandRecord)({
                name: brandVal.cleanName || brandName,
                slug: (0, slugify_1.default)(brandVal.cleanName || brandName, { lower: true, strict: true, trim: true }) + '-' + (0, nanoid_1.nanoid)(5),
                categoryIds: [categoryId],
                isActive: false,
                status: catalogStatus_1.CATALOG_STATUS.PENDING,
                suggestedBy: userId
            });
        }
        const brandId = String(brand._id);
        let model = await (0, CatalogBrandModelService_1.findModelByNameAndBrand)(modelRegex, brandId);
        if (!model) {
            const modelVal = (0, suggestionValidation_1.validateModelSuggestion)(modelName);
            model = await (0, CatalogBrandModelService_1.createModelRecord)({
                name: modelVal.cleanName || modelName,
                brandId: brand._id,
                categoryIds: [categoryId],
                isActive: false,
                status: catalogStatus_1.CATALOG_STATUS.PENDING,
                suggestedBy: userId
            });
        }
        await CatalogOrchestrator_1.default.invalidateCatalogCache();
        res.status(201).json((0, respond_1.respond)({ success: true, data: model }));
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.ensureModel = ensureModel;
//# sourceMappingURL=catalogBrandModelController.js.map