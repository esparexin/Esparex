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
import ScreenSizeModel from '../../models/ScreenSize';
import SmartAlertModel from '../../models/SmartAlert';
import { CATALOG_APPROVAL_STATUS } from '../../constants/enums/catalogApprovalStatus';
import { ACTIVE_CATEGORY_QUERY, ACTIVE_BRAND_QUERY } from './CatalogValidationService';

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
        ...ACTIVE_BRAND_QUERY,
        categoryIds: { $in: activeCategoryIds }
    }).select('_id').lean();
    return brands.map(b => String(b._id));
};

/** Return true if the brand is active and belongs to one of the given categories. */
export const checkBrandInCategories = async (brandId: string, activeCategoryIds: string[]) =>
    BrandModelImport.exists({
        _id: brandId,
        ...ACTIVE_BRAND_QUERY,
        categoryIds: { $in: activeCategoryIds }
    });

/** Find an active brand by case-insensitive name regex (for suggestBrand). */
export const findActiveBrandByName = async (nameRegex: RegExp) =>
    BrandModelImport.findOne({
        name: { $regex: nameRegex },
        approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
        isActive: true,
        isDeleted: { $ne: true },
        deletedAt: null
    }).lean();

/** Find a pending brand suggestion from the same user (for suggestBrand duplicate check). */
export const findPendingBrandSuggestion = async (
    nameRegex: RegExp,
    categoryIds: string,
    suggestedBy: string | { toString(): string } | null | undefined
) =>
    BrandModelImport.findOne({
        name: { $regex: nameRegex },
        approvalStatus: CATALOG_APPROVAL_STATUS.PENDING,
        categoryIds,
        suggestedBy: suggestedBy as string | undefined
    }).lean();

/** Create a new brand record. */
export const createBrandRecord = async (data: Record<string, unknown>) =>
    BrandModelImport.create(data);

/** Find a brand by exact name regex within a specific category (for ensureModel). */
export const findBrandByNameInCategory = async (nameRegex: RegExp, categoryId: string) =>
    BrandModelImport.findOne({ name: { $regex: nameRegex }, categoryIds: categoryId });

// ─── Brand dependency counts ──────────────────────────────────────────────────

/** Dependency check for brand deletion — counts linked models, listings, spare parts, screen sizes, smart alerts. */
export const checkBrandDependencies = async (id: string) => {
    const [modelsCount, listingsCount, sparePartsCount, screenSizesCount, smartAlertsCount] = await Promise.all([
        CatalogModelImport.countDocuments({ brandId: id }),
        AdModel.countDocuments({ brandId: id }),
        SparePartModel.countDocuments({ brandId: id }),
        ScreenSizeModel.countDocuments({ brandId: id }),
        SmartAlertModel.countDocuments({ brandId: id })
    ]);
    return {
        count: modelsCount + listingsCount + sparePartsCount + screenSizesCount + smartAlertsCount,
        details: {
            models: modelsCount,
            listings: listingsCount,
            spareParts: sparePartsCount,
            screenSizes: screenSizesCount,
            smartAlerts: smartAlertsCount
        }
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

/** Find model directly by SEO slug. */
export const findModelBySlug = async (slug: string, baseFilter: Record<string, unknown>) =>
    CatalogModelImport.findOne({ slug, ...baseFilter }).populate('brandId categoryIds');

/** Find an existing model suggestion (Active or Pending) by name + brandId (for suggestModel). */
export const findModelSuggestion = async (nameRegex: RegExp, brandId: string) =>
    CatalogModelImport.findOne({
        name: { $regex: nameRegex },
        brandId,
        approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] }
    }).lean();

/** Find a brand by exact name regex under a brand (for ensureModel). */
export const findModelByNameAndBrand = async (nameRegex: RegExp, brandId: string) =>
    CatalogModelImport.findOne({ name: { $regex: nameRegex }, brandId });

/** Find a brand by global canonicalName (for global deduplication). */
export const findBrandByCanonicalName = async (canonicalName: string) =>
    BrandModelImport.findOne({ canonicalName });

/** Find a model by brand and canonicalName (for brand-scoped deduplication). */
export const findModelByBrandAndCanonicalName = async (brandId: string, canonicalName: string) =>
    CatalogModelImport.findOne({ brandId, canonicalName });

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
