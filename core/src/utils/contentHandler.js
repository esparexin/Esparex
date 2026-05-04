"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaginatedContent = handlePaginatedContent;
const listingType_1 = require("@esparex/shared/enums/listingType");
const adminBaseController_1 = require("./adminBaseController");
const stringUtils_1 = require("@core/utils/stringUtils");
const redisCache_1 = require("@core/utils/redisCache");
const parseSortQuery = (rawSort, defaultSort) => {
    if (typeof rawSort !== 'string' || rawSort.trim().length === 0) {
        return defaultSort;
    }
    const sort = {};
    const segments = rawSort.split(',').map((segment) => segment.trim()).filter(Boolean);
    for (const segment of segments) {
        const direction = segment.startsWith('-') ? -1 : 1;
        const field = segment.replace(/^-/, '');
        if (!/^[a-zA-Z0-9_.]+$/.test(field)) {
            continue;
        }
        sort[field] = direction;
    }
    return Object.keys(sort).length > 0 ? sort : defaultSort;
};
/**
 * Generic handler for paginated content retrieval (Master Data / Catalog).
 * Standardizes the "Public vs Admin" view logic.
 */
async function handlePaginatedContent(req, res, model, options = {}) {
    try {
        const user = req.user;
        const isAdmin = Boolean(req.admin) ||
            user?.role === 'admin' ||
            user?.role === 'super_admin';
        const isUrlAdmin = req.originalUrl.includes('/admin');
        const { searchFields = ['name'], defaultSort = { name: 1 }, publicQuery = { isActive: true }, adminQuery = {}, populate, select, transformResponse, queryParams } = options;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const effectiveQuery = (queryParams || req.query);
        const CATALOG_MODELS = ['Category', 'Brand', 'Model', 'ServiceType', 'ScreenSize', 'SparePart'];
        let cacheKey = null;
        if (CATALOG_MODELS.includes(model.modelName)) {
            const roleSuffix = isUrlAdmin ? 'admin' : 'public';
            const sortedQuery = Object.keys(effectiveQuery)
                .sort()
                .map(k => `${k}=${encodeURIComponent(String(effectiveQuery[k]))}`)
                .join('&');
            cacheKey = `catalog:list:${model.modelName.toLowerCase()}:${roleSuffix}:${req.path}?${sortedQuery}`;
            const cachedPayload = await (0, redisCache_1.getCache)(cacheKey);
            if (cachedPayload) {
                if (isUrlAdmin) {
                    if (Array.isArray(cachedPayload.items) &&
                        typeof cachedPayload.total === 'number' &&
                        typeof cachedPayload.page === 'number' &&
                        typeof cachedPayload.limit === 'number') {
                        return (0, adminBaseController_1.sendPaginatedResponse)(res, cachedPayload.items, cachedPayload.total, cachedPayload.page, cachedPayload.limit);
                    }
                    return (0, adminBaseController_1.sendSuccessResponse)(res, cachedPayload);
                }
                else {
                    return (0, adminBaseController_1.sendSuccessResponse)(res, cachedPayload);
                }
            }
        }
        if (isAdmin && isUrlAdmin) {
            const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
            const rawSearch = Array.isArray(effectiveQuery.q) ? effectiveQuery.q[0] : effectiveQuery.q;
            const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';
            const includeDeleted = effectiveQuery.includeDeleted === 'true';
            const query = { ...adminQuery };
            if (!includeDeleted && !('isDeleted' in query)) {
                query.isDeleted = { $ne: true };
            }
            // Apply search
            if (search && searchFields.length > 0) {
                const safeSearch = (0, stringUtils_1.escapeRegExp)(search);
                query.$or = searchFields.map(field => ({
                    [field]: { $regex: safeSearch, $options: 'i' }
                }));
            }
            // Allowlisted URL params that can be forwarded to MongoDB as field filters.
            // SSOT: do NOT expand this list without a schema review — arbitrary params
            // create accidental filter injection (e.g. ?sort=name → query.sort="name").
            const ALLOWED_FILTER_PARAMS = new Set([
                'status', 'isActive', 'categoryId', 'brandId', 'modelId',
                'type', 'needsReview', 'suggestedBy', 'createdBy', 'listingType',
            ]);
            // Params handled elsewhere or purely for presentation — never forward to Mongo.
            const IGNORED_PARAMS = new Set([
                'page', 'limit', 'q', 'search', 'includeDeleted', 'sort', 'order', 'tab', 'view',
            ]);
            Object.entries(effectiveQuery).forEach(([key, value]) => {
                if (IGNORED_PARAMS.has(key))
                    return;
                if (!ALLOWED_FILTER_PARAMS.has(key)) {
                    // Unknown param: skip and do not inject into Mongo query
                    return;
                }
                if (query[key] !== undefined) {
                    return;
                }
                if (value === 'all' || value === '' || value === undefined || value === null) {
                    return;
                }
                if (key === 'status' && value === 'deleted' && query.isDeleted === true) {
                    return;
                }
                query[key] = value;
            });
            // Honour the ?sort= param as a sort directive (not a Mongo field filter).
            const rawAdminSort = Array.isArray(effectiveQuery.sort)
                ? effectiveQuery.sort[0]
                : effectiveQuery.sort;
            const adminSort = parseSortQuery(rawAdminSort, { createdAt: -1 });
            const findQuery = model.find(query).skip(skip).limit(limit).sort(adminSort);
            if (includeDeleted) {
                findQuery.setOptions({ withDeleted: true });
            }
            if (populate) {
                findQuery.populate(populate);
            }
            if (select) {
                findQuery.select(select);
            }
            const countQuery = model.countDocuments(query);
            if (includeDeleted) {
                countQuery.setOptions({ withDeleted: true });
            }
            const [items, total] = await Promise.all([
                findQuery,
                countQuery
            ]);
            const resolvedItems = transformResponse
                ? await transformResponse(items)
                : items;
            if (!Array.isArray(resolvedItems)) {
                if (cacheKey)
                    await (0, redisCache_1.setCache)(cacheKey, resolvedItems, redisCache_1.CACHE_TTLS.CATEGORIES);
                return (0, adminBaseController_1.sendSuccessResponse)(res, resolvedItems);
            }
            const payload = { items: resolvedItems, total, page, limit };
            if (cacheKey)
                await (0, redisCache_1.setCache)(cacheKey, payload, redisCache_1.CACHE_TTLS.CATEGORIES);
            return (0, adminBaseController_1.sendPaginatedResponse)(res, resolvedItems, total, page, limit);
        }
        // Public View
        const rawPage = effectiveQuery.page;
        const rawLimit = effectiveQuery.limit;
        const rawSearch = Array.isArray(effectiveQuery.q) ? effectiveQuery.q[0] : effectiveQuery.q;
        const rawSort = Array.isArray(effectiveQuery.sort) ? effectiveQuery.sort[0] : effectiveQuery.sort;
        const page = parseInt(String(rawPage || '1'));
        const limit = parseInt(String(rawLimit || '100'));
        const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';
        const sort = parseSortQuery(rawSort, defaultSort);
        const query = { ...publicQuery };
        // Public query hardening: do not merge arbitrary URL params into Mongo query.
        if (search && searchFields.length > 0) {
            const safeSearch = (0, stringUtils_1.escapeRegExp)(search);
            query.$or = searchFields.map((field) => ({
                [field]: { $regex: safeSearch, $options: 'i' }
            }));
        }
        // Allow explicit listingType filtering in public views (e.g. for Post Ad Step 1)
        if (typeof effectiveQuery.listingType === 'string') {
            const rawListingType = effectiveQuery.listingType.trim();
            if (listingType_1.LISTING_TYPE_VALUES.includes(rawListingType)) {
                query.listingType = rawListingType;
            }
        }
        const findQuery = model.find(query).skip((page - 1) * limit).limit(limit).sort(sort);
        if (populate) {
            findQuery.populate(populate);
        }
        if (select) {
            findQuery.select(select);
        }
        const [items, total] = await Promise.all([
            findQuery,
            model.countDocuments(query)
        ]);
        const resolvedItems = transformResponse
            ? await transformResponse(items)
            : items;
        if (!Array.isArray(resolvedItems)) {
            if (cacheKey)
                await (0, redisCache_1.setCache)(cacheKey, resolvedItems, redisCache_1.CACHE_TTLS.CATEGORIES);
            return (0, adminBaseController_1.sendSuccessResponse)(res, resolvedItems);
        }
        const payload = { items: resolvedItems, total };
        if (cacheKey)
            await (0, redisCache_1.setCache)(cacheKey, payload, redisCache_1.CACHE_TTLS.CATEGORIES);
        return (0, adminBaseController_1.sendSuccessResponse)(res, payload);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
}
//# sourceMappingURL=contentHandler.js.map