/**
 * CatalogBrandModelService
 * DB operations for Brand and Model catalog entities.
 * Re-exports the Mongoose model instances so controllers can pass them to
 * generic handler utilities (handleCatalogCreate, handlePaginatedContent, etc.)
 * without importing from models/ directly.
 */

import BrandModelImport from '../../models/Brand';
import CatalogModelImport from '../../models/Model';
import AdModel from '../../models/Ad';
import SparePartModel from '../../models/SparePart';
import CategoryModel from '../../models/Category';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { ACTIVE_CATEGORY_QUERY } from './CatalogValidationService';

// Re-export model instances for generic handler calls in the controller layer
export const BrandModel = BrandModelImport;
export const CatalogModel = CatalogModelImport;

// ─── Category helpers (needed by brand/model context) ─────────────────────────

/** Resolve a category by slug, with optional extra filter (e.g. active-only). */
export const findCategoryBySlugForCatalog = async (
    slug: string,
    extraQuery: Record<string, unknown> = {}
) => CategoryModel.findOne({ slug, ...extraQuery });

/** Check whether a category parent exists (used in createCategory / updateCategory). */
export const categoryExistsById = async (id: string) =>
    CategoryModel.exists({ _id: id, ...ACTIVE_CATEGORY_QUERY });

// ─── Brand queries ────────────────────────────────────────────────────────────

/** findOne with populated categoryIds — covers getBrandById + getBrandBySlug. */
export const findBrandByFilter = async (filter: Record<string, unknown>) =>
    BrandModelImport.findOne(filter).populate('categoryIds');

/** Return the _id strings of all active brands in the given categories. */
export const getActiveBrandIds = async (activeCategoryIds: string[]): Promise<string[]> => {
    const brands = await BrandModelImport.find({
        isActive: true,
        $or: [
            { status: CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } }
        ],
        categoryIds: { $in: activeCategoryIds }
    }).select('_id').lean();
    return brands.map(b => String(b._id));
};

/** Return true if the brand is active and belongs to one of the given categories. */
export const checkBrandInCategories = async (brandId: string, activeCategoryIds: string[]) =>
    BrandModelImport.exists({
        _id: brandId,
        isActive: true,
        $or: [
            { status: CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } }
        ],
        categoryIds: { $in: activeCategoryIds }
    });

/** Find an active brand by case-insensitive name regex (for suggestBrand). */
export const findActiveBrandByName = async (nameRegex: RegExp) =>
    BrandModelImport.findOne({ name: { $regex: nameRegex }, status: CATALOG_STATUS.ACTIVE }).lean();

/** Find a pending brand suggestion from the same user (for suggestBrand duplicate check). */
export const findPendingBrandSuggestion = async (
    nameRegex: RegExp,
    categoryIds: string,
    suggestedBy: unknown
) =>
    BrandModelImport.findOne({
        name: { $regex: nameRegex },
        status: CATALOG_STATUS.PENDING,
        categoryIds,
        suggestedBy
    }).lean();

/** Create a new brand record. */
export const createBrandRecord = async (data: Record<string, unknown>) =>
    BrandModelImport.create(data);

/** Find a brand by exact name regex within a specific category (for ensureModel). */
export const findBrandByNameInCategory = async (nameRegex: RegExp, categoryId: string) =>
    BrandModelImport.findOne({ name: { $regex: nameRegex }, categoryIds: categoryId });

// ─── Brand dependency counts ──────────────────────────────────────────────────

/** Dependency check for brand deletion — counts linked models, listings, spare parts. */
export const checkBrandDependencies = async (id: string) => {
    const [modelsCount, listingsCount, sparePartsCount] = await Promise.all([
        CatalogModelImport.countDocuments({ brandId: id }),
        AdModel.countDocuments({ brandId: id }),
        SparePartModel.countDocuments({ brandId: id })
    ]);
    return {
        count: modelsCount + listingsCount + sparePartsCount,
        details: { models: modelsCount, listings: listingsCount, spareParts: sparePartsCount }
    };
};

// ─── Model queries ────────────────────────────────────────────────────────────

/** findOne with full populate — covers getModelById. */
export const findModelByFilter = async (filter: Record<string, unknown>) =>
    CatalogModelImport.findOne(filter).populate('brandId categoryIds');

/** find by name pattern with full populate — covers getModelBySlug. */
export const findModelsByPattern = async (
    namePattern: RegExp,
    baseFilter: Record<string, unknown>
) => CatalogModelImport.find({ name: namePattern, ...baseFilter }).populate('brandId categoryIds');

/** Find an existing model suggestion (Active or Pending) by name + brandId (for suggestModel). */
export const findModelSuggestion = async (nameRegex: RegExp, brandId: string) =>
    CatalogModelImport.findOne({
        name: { $regex: nameRegex },
        brandId,
        status: { $in: [CATALOG_STATUS.ACTIVE, CATALOG_STATUS.PENDING] }
    }).lean();

/** Find a model by exact name regex under a brand (for ensureModel). */
export const findModelByNameAndBrand = async (nameRegex: RegExp, brandId: string) =>
    CatalogModelImport.findOne({ name: { $regex: nameRegex }, brandId });

/** Create a new model record. */
export const createModelRecord = async (data: Record<string, unknown>) =>
    CatalogModelImport.create(data);

// ─── Model dependency counts ──────────────────────────────────────────────────

/** Dependency check for model deletion — counts linked listings and spare parts. */
export const checkModelDependencies = async (id: string) => {
    const [listingsCount, sparePartsCount] = await Promise.all([
        AdModel.countDocuments({ modelId: id }),
        SparePartModel.countDocuments({ modelId: id })
    ]);
    return {
        count: listingsCount + sparePartsCount,
        details: { listings: listingsCount, spareParts: sparePartsCount }
    };
};
