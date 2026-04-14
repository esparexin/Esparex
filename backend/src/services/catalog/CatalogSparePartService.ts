/**
 * CatalogSparePartService
 * DB operations for SparePart catalog entity.
 * Re-exports the Mongoose model instance for generic handler calls.
 */

import SparePartModelImport from '../../models/SparePart';
import CategoryModel from '../../models/Category';
import BrandModel from '../../models/Brand';
import CatalogModel from '../../models/Model';
import AdModel from '../../models/Ad';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';

// Re-export model instance for generic handler calls in the controller layer
export const SparePartModel = SparePartModelImport;

// ─── Category slug resolution ─────────────────────────────────────────────────

/** Resolve a category ObjectId string from a URL slug (with optional extra filter). */
export const findCategoryIdBySlug = async (
    categoryParam: string,
    extraQuery: Record<string, unknown> = {}
): Promise<string | null> => {
    const category = await CategoryModel.findOne({ slug: categoryParam, ...extraQuery });
    return category ? category._id.toString() : null;
};

// ─── Active brand/model ID helpers ───────────────────────────────────────────

/** Return _id strings of all active brands in the given categories (spare parts view). */
export const getActiveBrandIdsForCategories = async (activeCategoryIds: string[]): Promise<string[]> => {
    const brands = await BrandModel.find({
        isActive: true,
        isDeleted: { $ne: true },
        $or: [
            { status: CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } }
        ],
        categoryIds: { $in: activeCategoryIds }
    }).select('_id').lean();
    return brands.map(b => String(b._id));
};

/** Return _id strings of all active models in the given categories (spare parts view). */
export const getActiveModelIdsForCategories = async (activeCategoryIds: string[]): Promise<string[]> => {
    const models = await CatalogModel.find({
        isActive: true,
        $or: [
            { status: CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } }
        ],
        categoryId: { $in: activeCategoryIds }
    }).select('_id').lean();
    return models.map(m => String(m._id));
};

// ─── Spare part queries ───────────────────────────────────────────────────────

export const findSparePartById = async (id: string) => SparePartModelImport.findById(id);

// ─── Dependency checks ────────────────────────────────────────────────────────

/** Check if any ads reference this spare part (used before deletion). */
export const checkSparePartDependencies = async (id: string) => {
    const adsCount = await AdModel.countDocuments({ sparePartIds: id });
    return { count: adsCount, details: { ads: adsCount } };
};
