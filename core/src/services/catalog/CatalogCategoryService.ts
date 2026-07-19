/**
 * CatalogCategoryService
 * DB operations for Category management.
 */

import { categoryRepository } from '../../composition/catalog';

const CACHE_TTL_MS = 60 * 1000;
let activeCategoryCache: { at: number; categories: any[] } | null = null;

const getActiveCategories = async () => {
    const now = Date.now();
    if (activeCategoryCache && now - activeCategoryCache.at < CACHE_TTL_MS) {
        return activeCategoryCache.categories;
    }

    const categories = await categoryRepository.findActive();
    activeCategoryCache = { at: now, categories };
    return categories;
};

export const clearCategoryCanonicalCache = () => {
    activeCategoryCache = null;
};

export const findCategoryById = async (id: string | undefined, extraQuery: Record<string, unknown> = {}) => {
    if (!id) return null;
    const category = await categoryRepository.findById(id);
    if (!category) return null;

    if (extraQuery.isActive === true && !category.isActive) return null;
    if (extraQuery.isDeleted && category.isDeleted) return null;
    if (extraQuery.approvalStatus && category.configuration.approvalStatus !== extraQuery.approvalStatus) return null;

    return category as any;
};

export const categoryParentExists = async (parentId: string | undefined) => {
    if (!parentId) return false;
    return categoryRepository.exists(parentId);
};

export const updateCategorySchemaById = async (id: string | undefined, filters: unknown[]) => {
    if (!id) return null;
    return categoryRepository.update(id, { filters });
};
