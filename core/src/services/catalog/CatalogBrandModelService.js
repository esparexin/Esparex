"use strict";
/**
 * CatalogBrandModelService
 * DB operations for Brand and Model catalog entities.
 * Re-exports the Mongoose model instances so controllers can pass them to
 * generic handler utilities (handleCatalogCreate, handlePaginatedContent, etc.)
 * without importing from models/ directly.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkModelDependencies = exports.createModelRecord = exports.findModelByNameAndBrand = exports.findModelSuggestion = exports.findModelsByPattern = exports.findModelByFilter = exports.checkBrandDependencies = exports.findBrandByNameInCategory = exports.createBrandRecord = exports.findPendingBrandSuggestion = exports.findActiveBrandByName = exports.checkBrandInCategories = exports.getActiveBrandIds = exports.findBrandByFilter = exports.categoryExistsById = exports.findCategoryBySlugForCatalog = exports.CatalogModel = exports.BrandModel = void 0;
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const SparePart_1 = __importDefault(require("@core/models/SparePart"));
const Category_1 = __importDefault(require("@core/models/Category"));
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const CatalogValidationService_1 = require("./CatalogValidationService");
// Re-export model instances for generic handler calls in the controller layer
exports.BrandModel = Brand_1.default;
exports.CatalogModel = Model_1.default;
// ─── Category helpers (needed by brand/model context) ─────────────────────────
/** Resolve a category by slug, with optional extra filter (e.g. active-only). */
const findCategoryBySlugForCatalog = async (slug, extraQuery = {}) => Category_1.default.findOne({ slug, ...extraQuery });
exports.findCategoryBySlugForCatalog = findCategoryBySlugForCatalog;
/** Check whether a category parent exists (used in createCategory / updateCategory). */
const categoryExistsById = async (id) => Category_1.default.exists({ _id: id, ...CatalogValidationService_1.ACTIVE_CATEGORY_QUERY });
exports.categoryExistsById = categoryExistsById;
// ─── Brand queries ────────────────────────────────────────────────────────────
/** findOne with populated categoryIds — covers getBrandById + getBrandBySlug. */
const findBrandByFilter = async (filter) => Brand_1.default.findOne(filter).populate('categoryIds');
exports.findBrandByFilter = findBrandByFilter;
/** Return the _id strings of all active brands in the given categories. */
const getActiveBrandIds = async (activeCategoryIds) => {
    const brands = await Brand_1.default.find({
        isActive: true,
        $or: [
            { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } }
        ],
        categoryIds: { $in: activeCategoryIds }
    }).select('_id').lean();
    return brands.map(b => String(b._id));
};
exports.getActiveBrandIds = getActiveBrandIds;
/** Return true if the brand is active and belongs to one of the given categories. */
const checkBrandInCategories = async (brandId, activeCategoryIds) => Brand_1.default.exists({
    _id: brandId,
    isActive: true,
    $or: [
        { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
        { status: { $exists: false } }
    ],
    categoryIds: { $in: activeCategoryIds }
});
exports.checkBrandInCategories = checkBrandInCategories;
/** Find an active brand by case-insensitive name regex (for suggestBrand). */
const findActiveBrandByName = async (nameRegex) => Brand_1.default.findOne({ name: { $regex: nameRegex }, status: catalogStatus_1.CATALOG_STATUS.ACTIVE }).lean();
exports.findActiveBrandByName = findActiveBrandByName;
/** Find a pending brand suggestion from the same user (for suggestBrand duplicate check). */
const findPendingBrandSuggestion = async (nameRegex, categoryIds, suggestedBy) => Brand_1.default.findOne({
    name: { $regex: nameRegex },
    status: catalogStatus_1.CATALOG_STATUS.PENDING,
    categoryIds,
    suggestedBy: suggestedBy
}).lean();
exports.findPendingBrandSuggestion = findPendingBrandSuggestion;
/** Create a new brand record. */
const createBrandRecord = async (data) => Brand_1.default.create(data);
exports.createBrandRecord = createBrandRecord;
/** Find a brand by exact name regex within a specific category (for ensureModel). */
const findBrandByNameInCategory = async (nameRegex, categoryId) => Brand_1.default.findOne({ name: { $regex: nameRegex }, categoryIds: categoryId });
exports.findBrandByNameInCategory = findBrandByNameInCategory;
// ─── Brand dependency counts ──────────────────────────────────────────────────
/** Dependency check for brand deletion — counts linked models, listings, spare parts. */
const checkBrandDependencies = async (id) => {
    const [modelsCount, listingsCount, sparePartsCount] = await Promise.all([
        Model_1.default.countDocuments({ brandId: id }),
        Ad_1.default.countDocuments({ brandId: id }),
        SparePart_1.default.countDocuments({ brandId: id })
    ]);
    return {
        count: modelsCount + listingsCount + sparePartsCount,
        details: { models: modelsCount, listings: listingsCount, spareParts: sparePartsCount }
    };
};
exports.checkBrandDependencies = checkBrandDependencies;
// ─── Model queries ────────────────────────────────────────────────────────────
/** findOne with full populate — covers getModelById. */
const findModelByFilter = async (filter) => Model_1.default.findOne(filter).populate('brandId categoryIds');
exports.findModelByFilter = findModelByFilter;
/** find by name pattern with full populate — covers getModelBySlug. */
const findModelsByPattern = async (namePattern, baseFilter) => Model_1.default.find({ name: namePattern, ...baseFilter }).populate('brandId categoryIds');
exports.findModelsByPattern = findModelsByPattern;
/** Find an existing model suggestion (Active or Pending) by name + brandId (for suggestModel). */
const findModelSuggestion = async (nameRegex, brandId) => Model_1.default.findOne({
    name: { $regex: nameRegex },
    brandId,
    status: { $in: [catalogStatus_1.CATALOG_STATUS.ACTIVE, catalogStatus_1.CATALOG_STATUS.PENDING] }
}).lean();
exports.findModelSuggestion = findModelSuggestion;
/** Find a model by exact name regex under a brand (for ensureModel). */
const findModelByNameAndBrand = async (nameRegex, brandId) => Model_1.default.findOne({ name: { $regex: nameRegex }, brandId });
exports.findModelByNameAndBrand = findModelByNameAndBrand;
/** Create a new model record. */
const createModelRecord = async (data) => Model_1.default.create(data);
exports.createModelRecord = createModelRecord;
// ─── Model dependency counts ──────────────────────────────────────────────────
/** Dependency check for model deletion — counts linked listings and spare parts. */
const checkModelDependencies = async (id) => {
    const [listingsCount, sparePartsCount] = await Promise.all([
        Ad_1.default.countDocuments({ modelId: id }),
        SparePart_1.default.countDocuments({ modelId: id })
    ]);
    return {
        count: listingsCount + sparePartsCount,
        details: { listings: listingsCount, spareParts: sparePartsCount }
    };
};
exports.checkModelDependencies = checkModelDependencies;
//# sourceMappingURL=CatalogBrandModelService.js.map