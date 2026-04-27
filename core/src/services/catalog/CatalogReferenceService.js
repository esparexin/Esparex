"use strict";
/**
 * CatalogReferenceService
 * DB operations for ServiceType and ScreenSize reference entities.
 * Re-exports the Mongoose model instances for generic handler calls.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveBrandsForScreenSizes = exports.findScreenSizeById = exports.checkServiceTypeDependencies = exports.findServiceTypeById = exports.findActiveCategoryBySlug = exports.findCategoryBySlug = exports.ScreenSizeModel = exports.ServiceTypeModel = void 0;
const ServiceType_1 = __importDefault(require("@core/models/ServiceType"));
const ScreenSize_1 = __importDefault(require("@core/models/ScreenSize"));
const Category_1 = __importDefault(require("@core/models/Category"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const adStatus_1 = require("@core/constants/enums/adStatus");
const CatalogValidationService_1 = require("./CatalogValidationService");
// Re-export model instances for generic handler calls in the controller layer
exports.ServiceTypeModel = ServiceType_1.default;
exports.ScreenSizeModel = ScreenSize_1.default;
// ─── Category slug resolution ─────────────────────────────────────────────────
/** Resolve a category by slug — no active filter (admin view). */
const findCategoryBySlug = async (slug) => Category_1.default.findOne({ slug });
exports.findCategoryBySlug = findCategoryBySlug;
/** Resolve a category by slug — with active filter (public view). */
const findActiveCategoryBySlug = async (slug) => Category_1.default.findOne({ slug, ...CatalogValidationService_1.ACTIVE_CATEGORY_QUERY });
exports.findActiveCategoryBySlug = findActiveCategoryBySlug;
// ─── Service type queries ─────────────────────────────────────────────────────
const findServiceTypeById = async (id) => {
    if (!id)
        return null;
    return ServiceType_1.default.findById(id).populate('categoryIds');
};
exports.findServiceTypeById = findServiceTypeById;
// ─── Service type dependency checks ──────────────────────────────────────────
/**
 * Check whether any live ads reference the given service type.
 * Used as the checkDependencies callback in handleCatalogDelete.
 */
const checkServiceTypeDependencies = async (id) => {
    const item = await ServiceType_1.default.findById(id);
    if (!item)
        return { count: 0, details: {} };
    const inUseCount = await Ad_1.default.countDocuments({
        status: adStatus_1.AD_STATUS.LIVE,
        $or: [
            { serviceTypeIds: item._id },
            { serviceTypes: item.name }
        ]
    });
    return { count: inUseCount, details: { services: inUseCount } };
};
exports.checkServiceTypeDependencies = checkServiceTypeDependencies;
// ─── Screen size queries ──────────────────────────────────────────────────────
const findScreenSizeById = async (id) => {
    if (!id)
        return null;
    return ScreenSize_1.default.findById(id).populate('categoryId');
};
exports.findScreenSizeById = findScreenSizeById;
// ─── Active brand IDs for screen sizes ───────────────────────────────────────
/**
 * Return active brand documents for the screen sizes public view.
 * Note: screen sizes use the singular `categoryId` field on brand, not `categoryIds`.
 */
const getActiveBrandsForScreenSizes = async (activeCategoryIds) => Brand_1.default.find({
    isActive: true,
    isDeleted: { $ne: true },
    $or: [
        { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
        { status: { $exists: false } }
    ],
    categoryId: { $in: activeCategoryIds }
}).select('_id').lean();
exports.getActiveBrandsForScreenSizes = getActiveBrandsForScreenSizes;
//# sourceMappingURL=CatalogReferenceService.js.map