/**
 * CatalogBrandModelService
 * DB operations for Brand and Model catalog entities.
 * Re-exports the Mongoose model instances so controllers can pass them to
 * generic handler utilities (handleCatalogCreate, handlePaginatedContent, etc.)
 * without importing from models/ directly.
 */

import BrandModelImport from '../../models/Brand';
import CatalogModelImport from '../../models/Model';
import { getListingRepository } from '../../composition/listings';
import SparePart from '../../models/SparePart';
import CategoryModel from '../../models/Category';
import ScreenSizeModel from '../../models/ScreenSize';
import SmartAlertModel from '../../models/SmartAlert';
import VariantModelImport from '../../models/Variant';
import { ACTIVE_CATEGORY_QUERY, ACTIVE_BRAND_QUERY } from './CatalogValidationService';
import { getModelDeletionImpact } from './CatalogHierarchyService';

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

// ─── Brand dependency counts ──────────────────────────────────────────────────

/** Dependency check for brand deletion — counts linked models, listings, spare parts, screen sizes, smart alerts. */
export const checkBrandDependencies = async (id: string) => {
    const [modelsCount, listingsCount, sparePartsCount, screenSizesCount, smartAlertsCount] = await Promise.all([
        CatalogModelImport.countDocuments({ brandId: id }),
        getListingRepository().count({ brandId: id }),
        SparePart.countDocuments({ brandId: id }),
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

/** Find model directly by SEO slug. */
export const findModelBySlug = async (slug: string, baseFilter: Record<string, unknown>) =>
    CatalogModelImport.findOne({ slug, ...baseFilter }).populate('brandId categoryIds');

// ─── Model dependency counts ──────────────────────────────────────────────────

/** Dependency check for model deletion — counts linked listings and spare parts. */
export const checkModelDependencies = async (id: string) => {
    const impact = await getModelDeletionImpact(id);
    return {
        count: impact.totalBlocked,
        details: {
            listings: impact.listings,
            spareParts: impact.spareParts,
            variants: impact.variants,
            childModels: impact.childModels,
            descendantModels: impact.descendantModels,
            activeHierarchyRoots: impact.activeHierarchyRoots,
        }
    };
};

export const getVariantsAndModelsForParentModels = async (modelIds: string[]) => {
    return Promise.all([
        VariantModelImport.find({ modelId: { $in: modelIds }, isDeleted: { $ne: true } }).sort({ name: 1 }).lean(),
        CatalogModelImport.find({ variantOfModelId: { $in: modelIds }, isDeleted: { $ne: true } }).sort({ name: 1 }).lean(),
    ]);
};

export const getBrandModelsForDuplicateCheck = async (brandId: string, excludeId?: string) => {
    return CatalogModelImport.find({
        brandId,
        isDeleted: { $ne: true },
        ...(excludeId ? { _id: { $ne: excludeId } } : {})
    })
    .select('_id name displayName canonicalName slug aliases synonyms parentModelId variantOfModelId')
    .limit(100)
    .lean();
};
