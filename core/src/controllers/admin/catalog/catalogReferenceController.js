"use strict";
/**
 * Catalog Reference Controller
 * Handles service types and screen sizes (reference data)
 * Extracted from catalog.content.controller.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScreenSize = exports.toggleScreenSizeStatus = exports.updateScreenSize = exports.createScreenSize = exports.getScreenSizeById = exports.getScreenSizes = exports.deleteServiceType = exports.toggleServiceTypeStatus = exports.updateServiceType = exports.createServiceType = exports.getServiceTypeById = exports.getServiceTypes = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const CatalogOrchestrator_1 = __importDefault(require("@esparex/core/services/catalog/CatalogOrchestrator"));
const shared_1 = require("./shared");
const CatalogValidationService_1 = require("@esparex/core/services/catalog/CatalogValidationService");
const catalog_validator_1 = require("@esparex/core/validators/catalog.validator");
const CategoryQueryBuilder_1 = __importDefault(require("@esparex/core/utils/CategoryQueryBuilder"));
const CatalogReferenceService_1 = require("@esparex/core/services/catalog/CatalogReferenceService");
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
// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// Reference data CRUD now delegated to shared.ts generic handlers.
/* ==========================================================
   SERVICE TYPES
   ========================================================== */
/**
 * Get all service types (with optional category filter)
 */
const getServiceTypes = async (req, res) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const categoryId = req.query.categoryId;
    let categoryObjectId = categoryId;
    if (!isAdminView && categoryId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            const cat = await (0, CatalogReferenceService_1.findCategoryBySlug)(categoryId);
            if (cat)
                categoryObjectId = cat._id.toString();
        }
    }
    const adminQuery = CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryId }).build();
    const publicQuery = {
        isActive: true,
        ...CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryId: categoryObjectId }).build()
    };
    return (0, shared_1.handlePaginatedContent)(req, res, CatalogReferenceService_1.ServiceTypeModel, {
        populate: isAdminView ? undefined : 'categoryIds',
        adminQuery,
        publicQuery
    });
};
exports.getServiceTypes = getServiceTypes;
/**
 * Get single service type by ID
 */
const getServiceTypeById = async (req, res) => {
    try {
        const serviceType = await (0, CatalogReferenceService_1.findServiceTypeById)(req.params.id);
        if (!serviceType)
            return (0, shared_1.sendCatalogError)(req, res, 'Service type not found', 404);
        (0, shared_1.sendSuccessResponse)(res, serviceType);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getServiceTypeById = getServiceTypeById;
/**
 * Create new service type
 */
const createServiceType = async (req, res) => {
    return (0, shared_1.handleCatalogCreate)(req, res, CatalogReferenceService_1.ServiceTypeModel, catalog_validator_1.serviceTypeCreateSchema, {
        auditAction: 'SERVICE_TYPE_CREATE',
        preOp: (payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            return Promise.resolve(payload);
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.createServiceType = createServiceType;
/**
 * Update existing service type
 */
const updateServiceType = async (req, res) => {
    return (0, shared_1.handleCatalogUpdate)(req, res, CatalogReferenceService_1.ServiceTypeModel, catalog_validator_1.serviceTypeUpdateSchema, {
        auditAction: 'SERVICE_TYPE_UPDATE',
        preUpdate: (id, payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;
            return Promise.resolve(payload);
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.updateServiceType = updateServiceType;
/**
 * Toggle service type active status
 */
const toggleServiceTypeStatus = async (req, res) => {
    return (0, shared_1.handleCatalogToggleStatus)(req, res, CatalogReferenceService_1.ServiceTypeModel, {
        auditAction: 'TOGGLE_SERVICE_TYPE_STATUS',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.toggleServiceTypeStatus = toggleServiceTypeStatus;
/**
 * Delete service type (soft delete with dependency check)
 */
const deleteServiceType = async (req, res) => {
    return (0, shared_1.handleCatalogDelete)(req, res, CatalogReferenceService_1.ServiceTypeModel, CatalogReferenceService_1.checkServiceTypeDependencies, {
        auditAction: 'SERVICE_TYPE_DELETE',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.deleteServiceType = deleteServiceType;
/* ==========================================================
   SCREEN SIZES
   ========================================================== */
/**
 * Get all screen sizes (with optional category filter)
 */
const getScreenSizes = async (req, res) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const { categoryId } = req.query;
    let categoryObjectId = categoryId;
    if (!isAdminView && categoryId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            const cat = await (0, CatalogReferenceService_1.findActiveCategoryBySlug)(categoryId);
            if (cat)
                categoryObjectId = cat._id;
        }
    }
    if (!isAdminView && categoryObjectId) {
        const activeCategoryValidation = await (0, shared_1.validateActiveCategories)([String(categoryObjectId)]);
        if (!activeCategoryValidation.ok) {
            return (0, shared_1.sendEmptyPublicList)(res);
        }
    }
    const activeCategoryIds = !isAdminView
        ? (categoryObjectId ? [String(categoryObjectId)] : await (0, shared_1.getActiveCategoryIds)())
        : [];
    if (!isAdminView && activeCategoryIds.length === 0) {
        return (0, shared_1.sendEmptyPublicList)(res);
    }
    const activeBrandDocs = !isAdminView
        ? await (0, CatalogReferenceService_1.getActiveBrandsForScreenSizes)(activeCategoryIds)
        : [];
    const activeBrandIds = activeBrandDocs.map((brand) => String(brand._id));
    const adminQuery = CategoryQueryBuilder_1.default.forSingular().withFilters({ categoryId: categoryId }).build();
    const publicQuery = {
        isActive: true,
        ...CategoryQueryBuilder_1.default.forSingular().withFilters({
            categoryId: categoryObjectId ? String(categoryObjectId) : undefined,
            categoryIds: activeCategoryIds
        }).build(),
        $or: [
            { brandId: { $exists: false } },
            { brandId: null },
            { brandId: { $in: activeBrandIds } }
        ]
    };
    return (0, shared_1.handlePaginatedContent)(req, res, CatalogReferenceService_1.ScreenSizeModel, {
        adminQuery,
        publicQuery,
        searchFields: ['name', 'size']
    });
};
exports.getScreenSizes = getScreenSizes;
/**
 * Get single screen size by ID
 */
const getScreenSizeById = async (req, res) => {
    try {
        const size = await (0, CatalogReferenceService_1.findScreenSizeById)(req.params.id);
        if (!size)
            return (0, shared_1.sendCatalogError)(req, res, 'Screen size not found', 404);
        (0, shared_1.sendSuccessResponse)(res, size);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getScreenSizeById = getScreenSizeById;
/**
 * Create new screen size
 */
const createScreenSize = async (req, res) => {
    return (0, shared_1.handleCatalogCreate)(req, res, CatalogReferenceService_1.ScreenSizeModel, catalog_validator_1.screenSizeCreateSchema, {
        auditAction: 'SCREEN_SIZE_CREATE',
        preOp: async (payload) => {
            if (!payload.name && payload.size)
                payload.name = `${String(payload.size)} Screen Size`;
            const categoryId = toOptionalString(payload.categoryId);
            const brandId = toOptionalString(payload.brandId);
            if (!categoryId)
                throw new Error('categoryId is required');
            payload.categoryId = categoryId;
            if (brandId)
                payload.brandId = brandId;
            const relation = await (0, CatalogValidationService_1.validateScreenSizeRelations)({ categoryId, brandId });
            if (!relation.ok)
                throw new Error(relation.reason || 'Invalid relation');
            return payload;
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.createScreenSize = createScreenSize;
/**
 * Update existing screen size
 */
const updateScreenSize = async (req, res) => {
    return (0, shared_1.handleCatalogUpdate)(req, res, CatalogReferenceService_1.ScreenSizeModel, catalog_validator_1.screenSizeUpdateSchema, {
        auditAction: 'SCREEN_SIZE_UPDATE',
        preUpdate: async (id, payload, existingSize) => {
            if (!payload.name && payload.size)
                payload.name = `${String(payload.size)} Screen Size`;
            const typedSize = existingSize;
            const nextCategoryId = toOptionalString(payload.categoryId) ?? toOptionalString(typedSize.categoryId);
            const nextBrandId = toOptionalString(payload.brandId) ?? toOptionalString(typedSize.brandId);
            if (!nextCategoryId)
                throw new Error('categoryId is required');
            if (payload.categoryId !== undefined)
                payload.categoryId = nextCategoryId;
            if (payload.brandId !== undefined && nextBrandId)
                payload.brandId = nextBrandId;
            const relation = await (0, CatalogValidationService_1.validateScreenSizeRelations)({ categoryId: nextCategoryId, brandId: nextBrandId });
            if (!relation.ok)
                throw new Error(relation.reason || 'Invalid relation');
            return payload;
        },
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.updateScreenSize = updateScreenSize;
/**
 * Toggle screen size active status
 */
const toggleScreenSizeStatus = async (req, res) => {
    return (0, shared_1.handleCatalogToggleStatus)(req, res, CatalogReferenceService_1.ScreenSizeModel, {
        auditAction: 'TOGGLE_SCREEN_SIZE_STATUS',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.toggleScreenSizeStatus = toggleScreenSizeStatus;
/**
 * Delete screen size (soft delete)
 */
const deleteScreenSize = async (req, res) => {
    return (0, shared_1.handleCatalogDelete)(req, res, CatalogReferenceService_1.ScreenSizeModel, undefined, {
        auditAction: 'SCREEN_SIZE_DELETE',
        postOp: () => void CatalogOrchestrator_1.default.invalidateCatalogCache()
    });
};
exports.deleteScreenSize = deleteScreenSize;
//# sourceMappingURL=catalogReferenceController.js.map