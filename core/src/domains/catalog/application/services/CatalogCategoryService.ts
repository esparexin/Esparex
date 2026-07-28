/**
 * CatalogCategoryService
 * DB operations for Category management.
 * Also owns the multi-model entity count query used by the admin dashboard.
 */

import mongoose, { type Model as MongooseModel } from 'mongoose';
import Category from '../../../../models/Category';
import Brand from '../../../../models/Brand';
import CatalogModel from '../../../../models/Model';
import SparePart from '../../../../models/SparePart';
import ServiceType from '../../../../models/ServiceType';
import ScreenSize from '../../../../models/ScreenSize';
import logger from '../../../../utils/logger';

// Re-export the Category model so controllers can pass it to generic handler
// utilities (handlePaginatedContent, handleCatalogToggleStatus) without importing
// from models/ directly.
export { default as CategoryModel } from '../../../../models/Category';

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

import { delCache } from '../../../../utils/redisCache';

export const clearCategoryCanonicalCache = () => {
    activeCategoryCache = null;
    void delCache('catalog:counts:overview').catch(() => {
        // Non-blocking catch for environments without active Redis connection
    });
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

export type ResolvedCategoryHierarchy = {
    rootCategoryId: string | null;
    categoryIds: string[];
    matchedBy: 'id' | 'slug' | 'none';
};

/**
 * Resolves a category ID or slug and returns target category ID + all active child subcategory IDs.
 * Returns a rich metadata object (rootCategoryId, categoryIds, matchedBy).
 * Bounded Context: Keeps category hierarchy resolution inside CatalogCategoryService.
 */
export const resolveCategoryWithSubcategoryIds = async (
    categoryIdOrSlug?: string | null
): Promise<ResolvedCategoryHierarchy> => {
    if (!categoryIdOrSlug) {
        return { rootCategoryId: null, categoryIds: [], matchedBy: 'none' };
    }
    const normalizedInput = categoryIdOrSlug.trim();
    if (!normalizedInput) {
        return { rootCategoryId: null, categoryIds: [], matchedBy: 'none' };
    }

    let matchedBy: 'id' | 'slug' | 'none' = 'none';
    let targetCategory: { _id: mongoose.Types.ObjectId } | null = null;

    if (mongoose.Types.ObjectId.isValid(normalizedInput)) {
        targetCategory = await Category.findOne({
            _id: normalizedInput,
            isDeleted: { $ne: true },
            isActive: true,
        }).select('_id').lean();
        if (targetCategory) matchedBy = 'id';
    }

    if (!targetCategory) {
        const canonicalSlug = CatalogFacade.category.normalize.canonicalizeCategorySlug(normalizedInput);
        const searchSlug = (canonicalSlug || normalizedInput).toLowerCase();
        const rawSlug = normalizedInput.toLowerCase();
        targetCategory = await Category.findOne({
            isDeleted: { $ne: true },
            isActive: true,
            $or: [
                { slug: searchSlug },
                { slug: rawSlug },
                { aliases: searchSlug },
                { aliases: rawSlug },
                { synonyms: searchSlug },
                { synonyms: rawSlug },
                { canonicalName: searchSlug },
                { canonicalName: rawSlug }
            ]
        }).select('_id').lean();
        if (targetCategory) matchedBy = 'slug';
    }


    if (!targetCategory) {
        return { rootCategoryId: null, categoryIds: [], matchedBy: 'none' };
    }

    const targetIdStr = String(targetCategory._id);
    const ids = new Set<string>([targetIdStr]);

    const collectDescendantIds = async (parentIds: mongoose.Types.ObjectId[], depth = 0) => {
        if (parentIds.length === 0 || depth >= 5) return;
        const children = await Category.find({
            parentId: { $in: parentIds },
            isDeleted: { $ne: true },
            isActive: true,
        }).select('_id').lean();

        if (children.length === 0) return;
        const nextParentIds: mongoose.Types.ObjectId[] = [];
        children.forEach((child) => {
            if (child._id) {
                const childIdStr = String(child._id);
                if (!ids.has(childIdStr)) {
                    ids.add(childIdStr);
                    nextParentIds.push(child._id as mongoose.Types.ObjectId);
                }
            }
        });

        if (nextParentIds.length > 0) {
            await collectDescendantIds(nextParentIds, depth + 1);
        }
    };

    await collectDescendantIds([targetCategory._id]);

    return {
        rootCategoryId: targetIdStr,
        categoryIds: Array.from(ids),
        matchedBy,
    };
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

/**
 * Recursively validates that setting categoryId's parent to targetParentId
 * does not introduce a circular hierarchy loop (e.g. A -> B -> C -> A).
 * Returns true if valid, false if invalid/circular.
 */
export const validateCategoryParentHierarchy = async (
    categoryId: string | undefined,
    targetParentId: string | undefined
): Promise<boolean> => {
    if (!targetParentId) return true;
    if (!mongoose.Types.ObjectId.isValid(targetParentId)) return false;

    const parentExists = await Category.exists({ _id: targetParentId, isDeleted: { $ne: true } });
    if (!parentExists) return false;

    if (categoryId && String(categoryId) === String(targetParentId)) {
        return false;
    }

    if (!categoryId) return true;

    const visited = new Set<string>([String(categoryId)]);
    let currentParentId: string | null = String(targetParentId);

    while (currentParentId) {
        if (visited.has(currentParentId)) {
            return false;
        }
        visited.add(currentParentId);

        const parentCategory: { parentId?: mongoose.Types.ObjectId } | null = await Category.findOne({
            _id: currentParentId,
            isDeleted: { $ne: true }
        }).select('parentId').lean();

        if (!parentCategory || !parentCategory.parentId) {
            break;
        }
        currentParentId = String(parentCategory.parentId);
    }

    return true;
};

export const updateCategorySchemaById = async (id: string | undefined, filters: unknown[]) => {
    if (!id) return null;
    return Category.findByIdAndUpdate(id, { filters }, { new: true, runValidators: true });
};
