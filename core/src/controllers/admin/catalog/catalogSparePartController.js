"use strict";
/**
 * Catalog Spare Parts Controller
 * Handles spare parts and user proposals
 * Extracted from catalog.content.controller.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSparePartById = exports.deleteSparePart = exports.toggleSparePartStatus = exports.updateSparePart = exports.createSparePart = exports.getSpareParts = void 0;
const logger_1 = __importDefault(require("@esparex/core/utils/logger"));
const contentHandler_1 = require("@esparex/core/utils/contentHandler");
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const respond_1 = require("@esparex/core/utils/respond");
const CatalogSparePartService_1 = require("@esparex/core/services/catalog/CatalogSparePartService");
const categoryCanonical_1 = require("@esparex/core/utils/categoryCanonical");
const shared_1 = require("./shared");
const CatalogOrchestrator_1 = __importDefault(require("@esparex/core/services/catalog/CatalogOrchestrator"));
const CatalogValidationService_1 = require("@esparex/core/services/catalog/CatalogValidationService");
const catalog_validator_1 = require("@esparex/core/validators/catalog.validator");
const CategoryQueryBuilder_1 = __importDefault(require("@esparex/core/utils/CategoryQueryBuilder"));
const listingType_1 = require("@esparex/shared/enums/listingType");
const redisCache_1 = require("@esparex/core/utils/redisCache");
// ── Cache helpers ──────────────────────────────────────────────────────────
const CATALOG_CACHE_TTL = 300; // 5 minutes
const sparePartsCacheKey = (categoryId, listingType) => `catalog:spare-parts:${categoryId}:${listingType ?? 'all'}`;
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
// ── Helper: Normalize listing type from query params ──────────────────────
const normalizeListingTypeFromQuery = (listingTypeParam) => {
    const value = listingTypeParam;
    if (typeof value !== 'string')
        return undefined;
    if (value === listingType_1.LISTING_TYPE.AD || value === listingType_1.LISTING_TYPE.SPARE_PART) {
        return value;
    }
    return undefined;
};
// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// SparePart CRUD now delegated to shared.ts generic handlers.
/**
 * Get spare parts for PUBLIC view (strict validation, active categories only)
 */
const getSparePartsPublic = async (req, res) => {
    const categoryParam = (req.query.categoryId || req.query.category);
    const requestedListingType = normalizeListingTypeFromQuery(req.query.listingType);
    let categoryObjectId = categoryParam;
    // Resolve category slug to ObjectId if needed
    if (categoryParam && !mongoose_1.default.Types.ObjectId.isValid(categoryParam)) {
        const resolvedCategoryId = await (0, CatalogSparePartService_1.findCategoryIdBySlug)(categoryParam, shared_1.ACTIVE_CATEGORY_QUERY);
        if (!resolvedCategoryId) {
            logger_1.default.debug('[Catalog] Category not found (public)', { categorySlug: categoryParam });
            return (0, shared_1.sendEmptyPublicList)(res);
        }
        categoryObjectId = resolvedCategoryId;
    }
    // Validate category is active
    if (categoryObjectId) {
        const activeCategoryValidation = await (0, shared_1.validateActiveCategories)([categoryObjectId]);
        if (!activeCategoryValidation.ok) {
            logger_1.default.debug('[Catalog] Category not active (public)', { categoryId: categoryObjectId, invalidCategoryIds: activeCategoryValidation.invalidCategoryIds });
            return (0, shared_1.sendEmptyPublicList)(res);
        }
    }
    // Get active categories
    const activeCategoryIds = categoryObjectId
        ? await (0, categoryCanonical_1.resolveEquivalentActiveCategoryIds)(categoryObjectId)
        : await (0, shared_1.getActiveCategoryIds)();
    if (activeCategoryIds.length === 0) {
        logger_1.default.warn('[Catalog] No active categories found for spare parts query', { categoryParam });
        return (0, shared_1.sendEmptyPublicList)(res);
    }
    // Fetch active brands and models for filtering
    const [activeBrandIds, activeModelIds] = await Promise.all([
        (0, CatalogSparePartService_1.getActiveBrandIdsForCategories)(activeCategoryIds),
        (0, CatalogSparePartService_1.getActiveModelIdsForCategories)(activeCategoryIds)
    ]);
    // Build public query
    const publicQuery = {
        isActive: true,
        ...CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryIds: activeCategoryIds }).build()
    };
    publicQuery.$and = [
        {
            $or: [
                { brandId: { $exists: false } },
                { brandId: null },
                { brandId: { $in: activeBrandIds } }
            ]
        },
        {
            $or: [
                { modelId: { $exists: false } },
                { modelId: null },
                { modelId: { $in: activeModelIds } }
            ]
        }
    ];
    if (requestedListingType) {
        publicQuery.listingType = requestedListingType;
    }
    logger_1.default.debug('[Catalog] getSparePartsPublic query', {
        categoryId: categoryObjectId,
        activeCategoryIds: activeCategoryIds.length,
        activeBrandIds: activeBrandIds.length,
        activeModelIds: activeModelIds.length,
        listingType: requestedListingType
    });
    // ── Redis cache ─────────────────────────────────────────────────────────
    const cacheKey = sparePartsCacheKey(categoryObjectId ?? 'all', requestedListingType);
    const cached = await (0, redisCache_1.getCache)(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            (0, redisCache_1.setCache)(cacheKey, body, CATALOG_CACHE_TTL).catch(() => { });
        }
        return originalJson(body);
    };
    // Clean query params
    const cleanQuery = { ...req.query };
    delete cleanQuery.categoryId;
    delete cleanQuery.category;
    delete cleanQuery.listingType;
    return (0, contentHandler_1.handlePaginatedContent)(req, res, CatalogSparePartService_1.SparePartModel, {
        publicQuery,
        queryParams: cleanQuery,
        defaultSort: { sortOrder: 1 }
    });
};
/**
 * Get spare parts for ADMIN view (no validation, all categories/statuses)
 */
const getSparePartsAdmin = async (req, res) => {
    const { status } = req.query;
    const categoryParam = (req.query.categoryId || req.query.category);
    const requestedListingType = normalizeListingTypeFromQuery(req.query.listingType);
    let categoryObjectId = categoryParam;
    // Resolve category slug to ObjectId if needed
    if (categoryParam && !mongoose_1.default.Types.ObjectId.isValid(categoryParam)) {
        const resolvedCategoryId = await (0, CatalogSparePartService_1.findCategoryIdBySlug)(categoryParam);
        if (resolvedCategoryId) {
            categoryObjectId = resolvedCategoryId;
        }
        else {
            logger_1.default.debug('[Catalog] Category not found (admin)', { categorySlug: categoryParam });
        }
    }
    // Build admin query
    const adminQuery = CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();
    if (status)
        adminQuery.status = status;
    if (requestedListingType) {
        adminQuery.listingType = requestedListingType;
    }
    logger_1.default.debug('[Catalog] getSparePartsAdmin query', {
        categoryId: categoryObjectId,
        listingType: requestedListingType,
        status
    });
    // Clean query params
    const cleanQuery = { ...req.query };
    delete cleanQuery.categoryId;
    delete cleanQuery.category;
    delete cleanQuery.listingType;
    delete cleanQuery.placement;
    return (0, contentHandler_1.handlePaginatedContent)(req, res, CatalogSparePartService_1.SparePartModel, {
        adminQuery,
        queryParams: cleanQuery,
        defaultSort: { sortOrder: 1 }
    });
};
/**
 * Get all spare parts (routes to public or admin handler)
 */
const getSpareParts = async (req, res) => {
    const isAdminView = req.originalUrl.includes('/admin');
    return isAdminView ? getSparePartsAdmin(req, res) : getSparePartsPublic(req, res);
};
exports.getSpareParts = getSpareParts;
/**
 * Create new spare part (admin only)
 */
const createSparePart = async (req, res) => {
    return (0, shared_1.handleCatalogCreate)(req, res, CatalogSparePartService_1.SparePartModel, catalog_validator_1.sparePartCreateSchema, {
        auditAction: 'SPARE_PART_CREATE',
        slugifyName: true,
        preOp: async (payload) => {
            // Backward compatibility mapping
            const categoryId = toOptionalString(payload.categoryId);
            if (!payload.categoryIds && categoryId) {
                payload.categoryIds = [categoryId];
            }
            delete payload.categoryId;
            const categoryIds = toStringArray(payload.categoryIds);
            const validatedCategoryIds = CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryIds: categoryIds ?? null }).getRawIds();
            const brandId = toOptionalString(payload.brandId);
            const modelId = toOptionalString(payload.modelId);
            if (categoryIds)
                payload.categoryIds = categoryIds;
            if (brandId)
                payload.brandId = brandId;
            if (modelId)
                payload.modelId = modelId;
            const relation = await (0, CatalogValidationService_1.validateSparePartRelations)({ categoryIds: validatedCategoryIds, brandId, modelId });
            if (!relation.ok)
                throw new Error(relation.reason || 'Invalid relation');
            payload.createdBy = (0, shared_1.getAdminActorId)(req);
            const listingType = toStringArray(payload.listingType);
            payload.listingType = listingType?.length ? listingType : [listingType_1.LISTING_TYPE.SPARE_PART];
            payload.usageCount = 0;
            return payload;
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.createSparePart = createSparePart;
/**
 * Update existing spare part
 */
const updateSparePart = async (req, res) => {
    return (0, shared_1.handleCatalogUpdate)(req, res, CatalogSparePartService_1.SparePartModel, catalog_validator_1.sparePartUpdateSchema, {
        auditAction: 'SPARE_PART_UPDATE',
        preUpdate: async (id, payload, existingPart) => {
            // Backward compatibility mapping
            const categoryId = toOptionalString(payload.categoryId);
            if (!payload.categoryIds && categoryId) {
                payload.categoryIds = [categoryId];
            }
            delete payload.categoryId;
            if (payload.name)
                payload.slug = (0, slugify_1.default)(payload.name, { lower: true, strict: true });
            // Use renamed categoryIds from and to payload
            const typedPart = existingPart;
            const nextCategories = toStringArray(payload.categoryIds) ?? toStringArray(typedPart.categoryIds) ?? [];
            const nextBrandId = toOptionalString(payload.brandId) ?? toOptionalString(typedPart.brandId);
            const nextModelId = toOptionalString(payload.modelId) ?? toOptionalString(typedPart.modelId);
            if (payload.categoryIds !== undefined)
                payload.categoryIds = nextCategories;
            if (payload.brandId !== undefined && nextBrandId)
                payload.brandId = nextBrandId;
            if (payload.modelId !== undefined && nextModelId)
                payload.modelId = nextModelId;
            const relation = await (0, CatalogValidationService_1.validateSparePartRelations)({
                categoryIds: nextCategories,
                brandId: nextBrandId,
                modelId: nextModelId
            });
            if (!relation.ok)
                throw new Error(relation.reason || 'Invalid relation');
            return payload;
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.updateSparePart = updateSparePart;
/**
 * Toggle spare part status
 */
const toggleSparePartStatus = async (req, res) => {
    return (0, shared_1.handleCatalogToggleStatus)(req, res, CatalogSparePartService_1.SparePartModel, {
        auditAction: 'TOGGLE_SPARE_PART_STATUS',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.toggleSparePartStatus = toggleSparePartStatus;
/**
 * Delete spare part (soft delete with dependency check)
 */
const deleteSparePart = async (req, res) => {
    return (0, shared_1.handleCatalogDelete)(req, res, CatalogSparePartService_1.SparePartModel, CatalogSparePartService_1.checkSparePartDependencies, {
        auditAction: 'SPARE_PART_DELETE',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.deleteSparePart = deleteSparePart;
/**
 * Get single spare part by ID
 */
const getSparePartById = async (req, res) => {
    try {
        const sparePart = await (0, CatalogSparePartService_1.findSparePartById)(req.params.id);
        if (!sparePart)
            return (0, shared_1.sendCatalogError)(req, res, 'Spare part not found', 404);
        (0, respond_1.sendSuccessResponse)(res, sparePart);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getSparePartById = getSparePartById;
//# sourceMappingURL=catalogSparePartController.js.map