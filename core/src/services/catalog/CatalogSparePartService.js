"use strict";
/**
 * CatalogSparePartService
 * DB operations for SparePart catalog entity.
 * Re-exports the Mongoose model instance for generic handler calls.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSparePartDependencies = exports.findSparePartById = exports.getActiveModelIdsForCategories = exports.getActiveBrandIdsForCategories = exports.findCategoryIdBySlug = exports.SparePartModel = void 0;
const SparePart_1 = __importDefault(require("@core/models/SparePart"));
const Category_1 = __importDefault(require("@core/models/Category"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
// Re-export model instance for generic handler calls in the controller layer
exports.SparePartModel = SparePart_1.default;
// ─── Category slug resolution ─────────────────────────────────────────────────
/** Resolve a category ObjectId string from a URL slug (with optional extra filter). */
const findCategoryIdBySlug = async (categoryParam, extraQuery = {}) => {
    const category = await Category_1.default.findOne({ slug: categoryParam, ...extraQuery });
    return category ? category._id.toString() : null;
};
exports.findCategoryIdBySlug = findCategoryIdBySlug;
// ─── Active brand/model ID helpers ───────────────────────────────────────────
/** Return _id strings of all active brands in the given categories (spare parts view). */
const getActiveBrandIdsForCategories = async (activeCategoryIds) => {
    const brands = await Brand_1.default.find({
        isActive: true,
        isDeleted: { $ne: true },
        $or: [
            { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } }
        ],
        categoryIds: { $in: activeCategoryIds }
    }).select('_id').lean();
    return brands.map(b => String(b._id));
};
exports.getActiveBrandIdsForCategories = getActiveBrandIdsForCategories;
/** Return _id strings of all active models in the given categories (spare parts view). */
const getActiveModelIdsForCategories = async (activeCategoryIds) => {
    const models = await Model_1.default.find({
        isActive: true,
        $or: [
            { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } }
        ],
        categoryId: { $in: activeCategoryIds }
    }).select('_id').lean();
    return models.map(m => String(m._id));
};
exports.getActiveModelIdsForCategories = getActiveModelIdsForCategories;
// ─── Spare part queries ───────────────────────────────────────────────────────
const findSparePartById = async (id) => {
    if (!id)
        return null;
    return SparePart_1.default.findById(id);
};
exports.findSparePartById = findSparePartById;
// ─── Dependency checks ────────────────────────────────────────────────────────
/** Check if any ads reference this spare part (used before deletion). */
const checkSparePartDependencies = async (id) => {
    const adsCount = await Ad_1.default.countDocuments({ sparePartIds: id });
    return { count: adsCount, details: { ads: adsCount } };
};
exports.checkSparePartDependencies = checkSparePartDependencies;
//# sourceMappingURL=CatalogSparePartService.js.map