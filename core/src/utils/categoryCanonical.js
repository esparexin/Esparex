"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCategoryCanonicalCache = exports.resolveEquivalentActiveCategoryIds = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = __importDefault(require("@core/models/Category"));
const ACTIVE_CATEGORY_QUERY = {
    isActive: true,
    isDeleted: { $ne: true },
    status: 'live'
};
const CACHE_TTL_MS = 60 * 1000;
let activeCategoryCache = null;
const normalizeToken = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const singularize = (token) => {
    if (token.endsWith('ies') && token.length > 4)
        return `${token.slice(0, -3)}y`;
    if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3)
        return token.slice(0, -1);
    return token;
};
const toCanonicalKey = (value) => {
    if (!value)
        return null;
    const normalized = normalizeToken(value);
    if (!normalized)
        return null;
    return singularize(normalized).replace(/-/g, '');
};
const categoryKeys = (category) => {
    const keys = new Set();
    const fromSlug = toCanonicalKey(category.slug);
    const fromName = toCanonicalKey(category.name);
    if (fromSlug)
        keys.add(fromSlug);
    if (fromName)
        keys.add(fromName);
    return keys;
};
const keysOverlap = (left, right) => {
    for (const key of left) {
        if (right.has(key))
            return true;
    }
    return false;
};
const getActiveCategories = async () => {
    const now = Date.now();
    if (activeCategoryCache && now - activeCategoryCache.at < CACHE_TTL_MS) {
        return activeCategoryCache.categories;
    }
    const categories = await Category_1.default.find(ACTIVE_CATEGORY_QUERY).select('_id slug name').lean();
    activeCategoryCache = { at: now, categories };
    return categories;
};
/**
 * Resolve active categories that are canonical equivalents (slug/name normalized).
 * This guards against catalog drift such as "Smartphone" vs "Smartphones".
 */
const resolveEquivalentActiveCategoryIds = async (categoryId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(categoryId))
        return [];
    const sourceCategory = await Category_1.default.findById(categoryId).select('_id slug name').lean();
    if (!sourceCategory)
        return [];
    const sourceKeys = categoryKeys(sourceCategory);
    if (sourceKeys.size === 0)
        return [String(sourceCategory._id)];
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
exports.resolveEquivalentActiveCategoryIds = resolveEquivalentActiveCategoryIds;
const clearCategoryCanonicalCache = () => {
    activeCategoryCache = null;
};
exports.clearCategoryCanonicalCache = clearCategoryCanonicalCache;
//# sourceMappingURL=categoryCanonical.js.map