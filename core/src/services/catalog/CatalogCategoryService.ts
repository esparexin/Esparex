/**
 * CatalogCategoryService
 * DB operations for Category management.
 * Also owns the multi-model entity count query used by the admin dashboard.
 */

import mongoose, { type Model as MongooseModel } from 'mongoose';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import CatalogModel from '../../models/Model';
import SparePart from '../../models/SparePart';
import ServiceType from '../../models/ServiceType';
import ScreenSize from '../../models/ScreenSize';
import logger from '../../utils/logger';

// Re-export the Category model so controllers can pass it to generic handler
// utilities (handlePaginatedContent, handleCatalogToggleStatus) without importing
// from models/ directly.
export { default as CategoryModel } from '../../models/Category';

import { CATALOG_STATUS, type CatalogStatusValue } from '@esparex/contracts';
import { CatalogFacade } from '@esparex/shared';

const ACTIVE_CATEGORY_QUERY = {
    isActive: true,
    isDeleted: { $ne: true },
    status: CATALOG_STATUS.LIVE as CatalogStatusValue
};

const CACHE_TTL_MS = 60 * 1000;
let activeCategoryCache: { at: number; categories: any[] } | null = null;

const getActiveCategories = async () => {
    const now = Date.now();
    if (activeCategoryCache && now - activeCategoryCache.at < CACHE_TTL_MS) {
        return activeCategoryCache.categories;
    }

    const categories = await Category.find(ACTIVE_CATEGORY_QUERY).select('_id slug name').lean();
    activeCategoryCache = { at: now, categories };
    return categories;
};

export const clearCategoryCanonicalCache = () => {
    activeCategoryCache = null;
};

export const resolveEquivalentActiveCategoryIds = async (categoryId: string): Promise<string[]> => {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) return [];

    const sourceCategory = await Category.findById(categoryId).select('_id slug name').lean<any>();
    if (!sourceCategory) return [];

    const sourceKeys = CatalogFacade.category.normalize.categoryKeys(sourceCategory.slug, sourceCategory.name);
    if (sourceKeys.size === 0) return [String(sourceCategory._id)];

    const activeCategories = await getActiveCategories();
    const matches = activeCategories
        .filter((category) => CatalogFacade.category.normalize.keysOverlap(sourceKeys, CatalogFacade.category.normalize.categoryKeys(category.slug, category.name)))
        .map((category) => String(category._id));

    // Always keep the requested category id as a fallback contract guard.
    if (!matches.includes(String(sourceCategory._id))) {
        matches.push(String(sourceCategory._id));
    }

    return matches;
};

// ─── Catalog-wide counts ──────────────────────────────────────────────────────

const CATALOG_COUNT_MAX_TIME_MS = 1500;
const CATALOG_COUNT_ESTIMATE_MAX_TIME_MS = 1000;

async function countCatalogCollectionSafely(
    model: MongooseModel<unknown>,
    filter: Record<string, unknown>,
    hint?: Record<string, 1 | -1>
): Promise<number> {
    const modelName = model.modelName || 'Unknown';
    const countOptions: Record<string, unknown> = {
        maxTimeMS: CATALOG_COUNT_MAX_TIME_MS,
        ...(hint ? { hint } : {})
    };
    try {
        return await model.collection.countDocuments(filter, countOptions);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isHintError = Boolean(hint) && /hint|index/i.test(message);
        if (isHintError) {
            try {
                return await model.collection.countDocuments(filter, { maxTimeMS: CATALOG_COUNT_MAX_TIME_MS });
            } catch (retryError) {
                logger.warn('[CatalogCounts] countDocuments retry without hint failed; using estimate', {
                    model: modelName,
                    error: retryError instanceof Error ? retryError.message : String(retryError)
                });
            }
        } else {
            logger.warn('[CatalogCounts] countDocuments failed; using estimate', { model: modelName, error: message });
        }
        return model.collection.estimatedDocumentCount({ maxTimeMS: CATALOG_COUNT_ESTIMATE_MAX_TIME_MS });
    }
}

export async function getCatalogEntityCounts() {
    const nonDeletedFilter = { isDeleted: { $ne: true } };
    const [categories, brands, models, spareParts, serviceTypes, screenSizes] = await Promise.all([
        countCatalogCollectionSafely(Category, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(Brand, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(CatalogModel, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(SparePart, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(ServiceType, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(ScreenSize, nonDeletedFilter, { isDeleted: 1 })
    ]);
    return { categories, brands, models, spareParts, serviceTypes, screenSizes };
}

// ─── Category queries ─────────────────────────────────────────────────────────

export const findCategoryById = async (id: string | undefined, extraQuery: Record<string, unknown> = {}) => {
    if (!id) return null;
    return Category.findOne({ _id: id, ...extraQuery });
};

export const categoryParentExists = async (parentId: string | undefined) => {
    if (!parentId) return false;
    return Category.exists({ _id: parentId });
};

export const updateCategorySchemaById = async (id: string | undefined, filters: unknown[]) => {
    if (!id) return null;
    return Category.findByIdAndUpdate(id, { filters }, { new: true, runValidators: true });
};
