import mongoose from 'mongoose';
import Category from '../models/Category';

type CategoryLite = {
    _id: mongoose.Types.ObjectId;
    slug?: string;
    name?: string;
};

const ACTIVE_CATEGORY_QUERY = {
    isActive: true,
    isDeleted: { $ne: true },
    status: 'live'
};

const CACHE_TTL_MS = 60 * 1000;
let activeCategoryCache: { at: number; categories: CategoryLite[] } | null = null;

const normalizeToken = (value: string): string =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const singularize = (token: string): string => {
    if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
    if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) return token.slice(0, -1);
    return token;
};

const toCanonicalKey = (value?: string): string | null => {
    if (!value) return null;
    const normalized = normalizeToken(value);
    if (!normalized) return null;
    return singularize(normalized).replace(/-/g, '');
};

const categoryKeys = (category: CategoryLite): Set<string> => {
    const keys = new Set<string>();
    const fromSlug = toCanonicalKey(category.slug);
    const fromName = toCanonicalKey(category.name);
    if (fromSlug) keys.add(fromSlug);
    if (fromName) keys.add(fromName);
    return keys;
};

const keysOverlap = (left: Set<string>, right: Set<string>): boolean => {
    for (const key of left) {
        if (right.has(key)) return true;
    }
    return false;
};

const getActiveCategories = async (): Promise<CategoryLite[]> => {
    const now = Date.now();
    if (activeCategoryCache && now - activeCategoryCache.at < CACHE_TTL_MS) {
        return activeCategoryCache.categories;
    }

    const categories = await Category.find(ACTIVE_CATEGORY_QUERY).select('_id slug name').lean<CategoryLite[]>();
    activeCategoryCache = { at: now, categories };
    return categories;
};

/**
 * Resolve active categories that are canonical equivalents (slug/name normalized).
 * This guards against catalog drift such as "Smartphone" vs "Smartphones".
 */
export const resolveEquivalentActiveCategoryIds = async (categoryId: string): Promise<string[]> => {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) return [];

    const sourceCategory = await Category.findById(categoryId).select('_id slug name').lean<CategoryLite | null>();
    if (!sourceCategory) return [];

    const sourceKeys = categoryKeys(sourceCategory);
    if (sourceKeys.size === 0) return [String(sourceCategory._id)];

    const activeCategories = await getActiveCategories();
    const matches = activeCategories
        .filter((category) => keysOverlap(sourceKeys, categoryKeys(category)))
        .map((category) => String(category._id));

    // Always keep the requested category id as a fallback contract guard.
    if (!matches.includes(String(sourceCategory._id))) {
        matches.push(String(sourceCategory._id));
    }

    return matches;
};

export const clearCategoryCanonicalCache = () => {
    activeCategoryCache = null;
};
