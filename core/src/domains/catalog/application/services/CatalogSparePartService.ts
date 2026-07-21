/**
 * CatalogSparePartService
 * DB operations for SparePart catalog entity.
 * Re-exports the Mongoose model instance for generic handler calls.
 */

import SparePartImport from '../../../../models/SparePart';
import CategoryModel from '../../../../models/Category';
import BrandModel from '../../../../models/Brand';
import CatalogModel from '../../../../models/Model';
import { getListingRepository } from '../../../../composition/listings';
import { CATALOG_APPROVAL_STATUS } from '@esparex/shared';

// Re-export model instance for generic handler calls in the controller layer
export const SparePartModel = SparePartImport;

// ─── Category slug resolution ─────────────────────────────────────────────────

/** Resolve a category ObjectId string from a URL slug (with optional extra filter). */
export const findCategoryIdBySlug = async (
    categoryParam: string,
    extraQuery: Record<string, unknown> = {}
): Promise<string | null> => {
    // 🔒 SECURITY: use $eq to prevent operator injection from categoryParam.
    // extraQuery is constructed internally (never from user input directly).
    const category = await CategoryModel.findOne({ slug: { $eq: categoryParam }, ...extraQuery });
    return category ? category._id.toString() : null;
};

// ─── Active brand/model ID helpers ───────────────────────────────────────────

/** Return _id strings of all active brands in the given categories (spare parts view). */
export const getActiveBrandIdsForCategories = async (activeCategoryIds: string[]): Promise<string[]> => {
    const brands = await BrandModel.find({
        isActive: true,
        isDeleted: { $ne: true },
        deletedAt: null,
        approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
        categoryIds: { $in: activeCategoryIds }
    }).select('_id').lean();
    return brands.map((b: { _id: unknown }) => String(b._id));
};

/** Return _id strings of all active models in the given categories (spare parts view). */
export const getActiveModelIdsForCategories = async (activeCategoryIds: string[]): Promise<string[]> => {
    const models = await CatalogModel.find({
        isActive: true,
        isDeleted: { $ne: true },
        deletedAt: null,
        approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
        categoryIds: { $in: activeCategoryIds }
    }).select('_id').lean();
    return models.map((m: { _id: unknown }) => String(m._id));
};

// ─── Spare part queries ───────────────────────────────────────────────────────

export const findSparePartById = async (id: string | undefined) => {
    if (!id) return null;
    return SparePartImport.findById(id);
};

// ─── Dependency checks ────────────────────────────────────────────────────────

/** Check if any ads reference this spare part (used before deletion). */
export const checkSparePartDependencies = async (id: string) => {
    const adsCount = await getListingRepository().count({ sparePartIds: id });
    return { count: adsCount, details: { ads: adsCount } };
};
