"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_BRAND_QUERY = exports.ACTIVE_CATEGORY_QUERY = void 0;
exports.getActiveCategoryIds = getActiveCategoryIds;
exports.validateActiveCategories = validateActiveCategories;
exports.validateBrandBelongsToCategory = validateBrandBelongsToCategory;
exports.validateBrandIsActive = validateBrandIsActive;
exports.validateModelBelongsToBrand = validateModelBelongsToBrand;
exports.validateAdCategoryCapability = validateAdCategoryCapability;
exports.validateServiceCategoryCapability = validateServiceCategoryCapability;
exports.getCategorySelectionMode = getCategorySelectionMode;
exports.validateSparePartRelations = validateSparePartRelations;
exports.validateScreenSizeRelations = validateScreenSizeRelations;
exports.validateCategoryIsActive = validateCategoryIsActive;
const Category_1 = __importDefault(require("@core/models/Category"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const CategoryQueryBuilder_1 = __importDefault(require("@core/utils/CategoryQueryBuilder"));
const idUtils_1 = require("@core/utils/idUtils");
// ─── Shared Mongo query fragments ────────────────────────────────────────────
/** Reusable filter for active, non-deleted categories */
exports.ACTIVE_CATEGORY_QUERY = {
    isActive: true,
    isDeleted: { $ne: true },
    status: catalogStatus_1.CATALOG_STATUS.ACTIVE,
};
/** Reusable filter for active, non-deleted brands */
exports.ACTIVE_BRAND_QUERY = {
    isActive: true,
    isDeleted: { $ne: true },
    $or: [
        { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
        { status: { $exists: false } },
    ],
};
// ─── Category helpers ─────────────────────────────────────────────────────────
/**
 * Return the ObjectId strings of all currently active categories.
 * If requestedCategoryIds is provided, only validates those IDs.
 */
async function getActiveCategoryIds(requestedCategoryIds) {
    const filter = { ...exports.ACTIVE_CATEGORY_QUERY };
    if (requestedCategoryIds && requestedCategoryIds.length > 0) {
        filter._id = { $in: requestedCategoryIds };
    }
    const categories = await Category_1.default.find(filter).select('_id').lean();
    return categories.map((c) => String(c._id));
}
/**
 * Validate that all supplied category IDs are active and non-deleted.
 */
async function validateActiveCategories(categoryIds) {
    const unique = Array.from(new Set(categoryIds));
    const activeIds = await getActiveCategoryIds(unique);
    const activeSet = new Set(activeIds);
    const invalidCategoryIds = unique.filter((id) => !activeSet.has(id));
    return { ok: invalidCategoryIds.length === 0, invalidCategoryIds };
}
// ─── Brand validation ─────────────────────────────────────────────────────────
/**
 * Validate that a brand exists, is active, and belongs to the given category.
 */
async function validateBrandBelongsToCategory(brandId, categoryId) {
    (0, idUtils_1.validateObjectIdOrThrow)('brandId', brandId);
    (0, idUtils_1.validateObjectIdOrThrow)('categoryId', categoryId);
    const brand = await Brand_1.default.findOne({
        _id: brandId,
        ...exports.ACTIVE_BRAND_QUERY,
        ...CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryId }).build(),
    }).select('_id').lean();
    if (!brand) {
        return { ok: false, reason: 'Brand is invalid, inactive, or does not belong to the specified category.' };
    }
    return { ok: true };
}
/**
 * Validate that a brand exists and is active (no category constraint).
 */
async function validateBrandIsActive(brandId) {
    (0, idUtils_1.validateObjectIdOrThrow)('brandId', brandId);
    const brand = await Brand_1.default.exists({ _id: brandId, ...exports.ACTIVE_BRAND_QUERY });
    if (!brand) {
        return { ok: false, reason: 'brandId refers to an invalid or inactive brand.' };
    }
    return { ok: true };
}
// ─── Model validation ─────────────────────────────────────────────────────────
/**
 * Validate that a model exists, is active, and (optionally) belongs to a given brand.
 */
async function validateModelBelongsToBrand(modelId, brandId) {
    (0, idUtils_1.validateObjectIdOrThrow)('modelId', modelId);
    if (brandId)
        (0, idUtils_1.validateObjectIdOrThrow)('brandId', brandId);
    const model = await Model_1.default.findOne({
        _id: modelId,
        isActive: true,
        isDeleted: { $ne: true },
        $or: [
            { status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } },
        ],
    }).select('brandId').lean();
    if (!model) {
        return { ok: false, reason: 'modelId refers to an invalid or inactive model.' };
    }
    if (brandId && String(model.brandId) !== brandId) {
        return { ok: false, reason: 'modelId does not belong to the specified brandId.' };
    }
    return { ok: true };
}
// ─── Ad validation ───────────────────────────────────────────────────────────
/**
 * Validate that a category supports ad listings (listingType: 'ad')
 */
async function validateAdCategoryCapability(categoryId) {
    (0, idUtils_1.validateObjectIdOrThrow)('categoryId', categoryId);
    const category = await Category_1.default.findOne({
        _id: categoryId,
        ...exports.ACTIVE_CATEGORY_QUERY,
        listingType: 'ad'
    }).select('_id').lean();
    if (!category) {
        return { ok: false, reason: 'This category does not support advertisements.' };
    }
    return { ok: true };
}
// ─── Service validation ──────────────────────────────────────────────────────
/**
 * Validate that a category supports service listings (listingType: 'service')
 */
async function validateServiceCategoryCapability(categoryId) {
    (0, idUtils_1.validateObjectIdOrThrow)('categoryId', categoryId);
    const category = await Category_1.default.findOne({
        _id: categoryId,
        ...exports.ACTIVE_CATEGORY_QUERY,
        listingType: 'service'
    }).select('_id').lean();
    if (!category) {
        return { ok: false, reason: 'This category does not support service listings.' };
    }
    return { ok: true };
}
async function getCategorySelectionMode(categoryId) {
    const doc = await Category_1.default.findById(categoryId)
        .select('serviceSelectionMode')
        .lean();
    return doc?.serviceSelectionMode ?? 'multi';
}
/**
 * Validate the full Category → Brand → Model hierarchy for a spare part.
 * Consolidates all the duplicated validation logic previously scattered across
 * the spare parts controller.
 */
async function validateSparePartRelations(payload) {
    const { categoryIds, brandId, modelId } = payload;
    if (!categoryIds || categoryIds.length === 0) {
        return { ok: false, reason: 'At least one category is required.' };
    }
    // Harden inputs: Category IDs must be valid hex strings
    try {
        categoryIds.forEach(id => (0, idUtils_1.validateObjectIdOrThrow)('categoryIds', id));
        if (brandId)
            (0, idUtils_1.validateObjectIdOrThrow)('brandId', brandId);
        if (modelId)
            (0, idUtils_1.validateObjectIdOrThrow)('modelId', modelId);
    }
    catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : 'Invalid ObjectId format' };
    }
    // 1. Category capability guard: categories must explicitly support spare parts
    const invalidCategories = await Category_1.default.find({
        _id: { $in: categoryIds },
        listingType: { $ne: 'spare_part' }
    }).select('_id').lean();
    if (invalidCategories.length > 0) {
        return { ok: false, reason: 'One or more categories do not support spare parts.' };
    }
    // 2. All category IDs must be active
    const { ok: categoriesOk, invalidCategoryIds } = await validateActiveCategories(categoryIds);
    if (!categoriesOk) {
        return { ok: false, reason: `Invalid or inactive categories: ${invalidCategoryIds.join(', ')}` };
    }
    // 3. Brand must be active and belong to one of the given categories
    if (brandId) {
        const brand = await Brand_1.default.exists({
            _id: brandId,
            ...exports.ACTIVE_BRAND_QUERY,
            ...CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryIds }).build(),
        });
        if (!brand) {
            return { ok: false, reason: 'brandId is invalid, inactive, or does not belong to the given categories.' };
        }
    }
    // 4. Model must be active and belong to the given brand (if both are present)
    if (modelId) {
        const modelResult = await validateModelBelongsToBrand(modelId, brandId);
        if (!modelResult.ok)
            return modelResult;
    }
    return { ok: true };
}
/**
 * Validate the Category → Brand hierarchy for a screen size entry.
 */
async function validateScreenSizeRelations(payload) {
    const { categoryId, brandId } = payload;
    // Harden inputs
    try {
        (0, idUtils_1.validateObjectIdOrThrow)('categoryId', categoryId);
        if (brandId)
            (0, idUtils_1.validateObjectIdOrThrow)('brandId', brandId);
    }
    catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : 'Invalid ObjectId format' };
    }
    // Category must be active and support screen sizes
    const categoryExists = await Category_1.default.exists({
        _id: categoryId,
        ...exports.ACTIVE_CATEGORY_QUERY,
        hasScreenSizes: true
    });
    if (!categoryExists) {
        return { ok: false, reason: 'categoryId refers to an invalid or inactive category, or one that does not support screen sizes.' };
    }
    if (!brandId)
        return { ok: true };
    // Brand must be active AND belong to this category
    const brand = await Brand_1.default.findOne({
        _id: brandId,
        ...exports.ACTIVE_BRAND_QUERY,
        ...CategoryQueryBuilder_1.default.forPlural().withFilters({ categoryId }).build(),
    }).select('_id').lean();
    if (!brand) {
        return { ok: false, reason: 'brandId is invalid, inactive, or does not belong to the specified category.' };
    }
    return { ok: true };
}
// ─── Brand–Category relation (for admin brand create/update) ─────────────────
/**
 * Validate that a category exists and is active (used when creating/updating a brand).
 */
async function validateCategoryIsActive(categoryId) {
    try {
        (0, idUtils_1.validateObjectIdOrThrow)('categoryId', categoryId);
    }
    catch {
        return { ok: false, reason: 'categoryId is not a valid ObjectId.' };
    }
    const exists = await Category_1.default.exists({ _id: categoryId, ...exports.ACTIVE_CATEGORY_QUERY });
    return exists
        ? { ok: true }
        : { ok: false, reason: 'categoryId refers to an invalid or inactive category.' };
}
//# sourceMappingURL=CatalogValidationService.js.map