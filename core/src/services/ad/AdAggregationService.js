"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListingSuggestions = exports.getAds = exports.getOwnerListings = void 0;
exports.hydrateAdMetadata = hydrateAdMetadata;
const adServiceBase_1 = require("./_shared/adServiceBase");
const AdSearchService_1 = require("./AdSearchService");
/**
 * Helper to fetch metadata with batch caching
 */
async function fetchMetadataWithCache(ids, type, query, idField = '_id') {
    if (ids.size === 0)
        return [];
    const idArray = Array.from(ids);
    const cacheKeys = idArray.map(id => adServiceBase_1.CACHE_KEYS.metadata(type, id));
    const cachedResults = await (0, adServiceBase_1.getMultiCache)(cacheKeys);
    const results = [];
    const missingIds = [];
    cachedResults.forEach((val, index) => {
        if (val) {
            results.push(val);
        }
        else {
            const id = idArray[index];
            if (id)
                missingIds.push(id);
        }
    });
    if (missingIds.length > 0) {
        const fresh = await query(missingIds);
        results.push(...fresh);
        // Update cache
        const cacheEntries = fresh.map(item => {
            const id = String(item[idField]);
            return {
                key: adServiceBase_1.CACHE_KEYS.metadata(type, id),
                value: item
            };
        });
        if (cacheEntries.length > 0) {
            await (0, adServiceBase_1.setMultiCache)(cacheEntries);
        }
    }
    return results;
}
/**
 * Returns paginated listings owned by a specific seller, with metadata populated.
 * Used for "My Listings" views.
 */
const getOwnerListings = async (query, page, limit) => {
    const populateSpecs = [
        { path: 'categoryId', model: adServiceBase_1.Category, select: 'name slug icon' },
        { path: 'brandId', model: adServiceBase_1.Brand, select: 'name slug' },
        { path: 'modelId', model: adServiceBase_1.ProductModel, select: 'name slug' },
        { path: 'sparePartId', model: adServiceBase_1.SparePart, select: 'name slug' },
        { path: 'serviceTypeIds', model: adServiceBase_1.ServiceType, select: 'name slug' },
    ];
    const itemsQuery = populateSpecs.reduce((builder, spec) => builder.populate(spec), adServiceBase_1.Ad.find(query));
    const [items, total] = await Promise.all([
        itemsQuery.sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        adServiceBase_1.Ad.countDocuments(query),
    ]);
    return { items, total };
};
exports.getOwnerListings = getOwnerListings;
async function hydrateAdMetadata(ads) {
    if (!ads || ads.length === 0)
        return ads;
    const categoryIds = new Set();
    const brandIds = new Set();
    const modelIds = new Set();
    const sparePartIds = new Set();
    const serviceTypeIds = new Set();
    const extractId = (val) => {
        if (!val)
            return null;
        if (typeof val === 'string')
            return val;
        if (typeof val === 'object') {
            const record = val;
            const objectId = record._id;
            if (typeof objectId === 'string' || objectId instanceof adServiceBase_1.mongoose.Types.ObjectId) {
                return objectId.toString();
            }
            const id = record.id;
            if (typeof id === 'string' || id instanceof adServiceBase_1.mongoose.Types.ObjectId) {
                return id.toString();
            }
        }
        if (val instanceof adServiceBase_1.mongoose.Types.ObjectId)
            return val.toString();
        return null;
    };
    ads.forEach(ad => {
        const catId = extractId(ad.categoryId || ad.category);
        if (catId)
            categoryIds.add(catId);
        const bId = extractId(ad.brandId || ad.brand);
        if (bId)
            brandIds.add(bId);
        const mId = extractId(ad.modelId || ad.model);
        if (mId)
            modelIds.add(mId);
        const spId = extractId(ad.sparePartId || ad.sparePart);
        if (spId)
            sparePartIds.add(spId);
        if (Array.isArray(ad.sparePartIds)) {
            ad.sparePartIds.forEach((id) => {
                const sid = extractId(id);
                if (sid)
                    sparePartIds.add(sid);
            });
        }
        if (Array.isArray(ad.serviceTypeIds)) {
            ad.serviceTypeIds.forEach((id) => {
                const sid = extractId(id);
                if (sid)
                    serviceTypeIds.add(sid);
            });
        }
    });
    const [categories, brands, models, spareParts, serviceTypes] = await Promise.all([
        fetchMetadataWithCache(categoryIds, 'category', (missing) => adServiceBase_1.Category.find({ _id: { $in: missing } }).select('name slug').lean()),
        fetchMetadataWithCache(brandIds, 'brand', (missing) => adServiceBase_1.Brand.find({ _id: { $in: missing } }).select('name slug').lean()),
        fetchMetadataWithCache(modelIds, 'model', (missing) => adServiceBase_1.ProductModel.find({ _id: { $in: missing } }).select('name slug').lean()),
        fetchMetadataWithCache(sparePartIds, 'sparepart', (missing) => adServiceBase_1.SparePart.find({ _id: { $in: missing } }).lean()),
        fetchMetadataWithCache(serviceTypeIds, 'servicetype', async (missing) => {
            const ServiceType = (await Promise.resolve().then(() => __importStar(require('@core/models/ServiceType')))).default;
            return ServiceType.find({ _id: { $in: missing } }).select('name').lean();
        })
    ]);
    const categoryMap = new Map(categories.map((c) => [String(c._id), c]));
    const brandMap = new Map(brands.map((b) => [String(b._id), b]));
    const modelMap = new Map(models.map((m) => [String(m._id), m]));
    const sparePartMap = new Map(spareParts.map((s) => [String(s._id), s]));
    const serviceTypeMap = new Map(serviceTypes.map((st) => [String(st._id), st]));
    ads.forEach(ad => {
        const catId = extractId(ad.categoryId || ad.category);
        if (catId) {
            ad.categoryId = catId;
            const cat = categoryMap.get(catId);
            if (cat) {
                if (cat.name)
                    ad.categoryName = cat.name;
            }
        }
        delete ad.category;
        const bId = extractId(ad.brandId || ad.brand);
        if (bId) {
            ad.brandId = bId;
            const brand = brandMap.get(bId);
            if (brand) {
                if (brand.name)
                    ad.brandName = brand.name;
            }
        }
        delete ad.brand;
        const mId = extractId(ad.modelId || ad.model);
        if (mId) {
            ad.modelId = mId;
            const model = modelMap.get(mId);
            if (model) {
                if (model.name)
                    ad.modelName = model.name;
            }
        }
        delete ad.model;
        const spId = extractId(ad.sparePartId || ad.sparePart);
        if (spId) {
            ad.sparePart = sparePartMap.get(spId);
        }
        if (Array.isArray(ad.sparePartIds)) {
            ad.spareParts = ad.sparePartIds
                .map((id) => {
                const sid = extractId(id);
                return sid ? sparePartMap.get(sid) : null;
            })
                .filter((value) => Boolean(value));
        }
        if (Array.isArray(ad.serviceTypeIds)) {
            ad.serviceTypes = ad.serviceTypeIds
                .map((id) => {
                const sid = extractId(id);
                return sid ? serviceTypeMap.get(sid) : null;
            })
                .filter((value) => Boolean(value));
        }
    });
    return ads;
}
const getAds = async (filters, pagination, options = {}) => {
    const { page: rawPage, limit: rawLimit, cursor } = pagination;
    // 🛡️ STAFF+ STABILITY GUARD: Anti-Skip Attack Protection
    // Prevents deep-pagination resource exhaustion (CPU/Memory spikes on skip > 10,000)
    // and enforces a hard ceiling on result set size.
    const MAX_PAGE_SIZE = 50;
    const MAX_PAGE = 1000;
    const limit = Math.min(Math.max(Number(rawLimit) || 20, 1), MAX_PAGE_SIZE);
    const page = Math.min(Math.max(Number(rawPage) || 1, 1), MAX_PAGE);
    const cursorId = typeof cursor === 'string' && adServiceBase_1.mongoose.Types.ObjectId.isValid(cursor)
        ? new adServiceBase_1.mongoose.Types.ObjectId(cursor)
        : null;
    const isCursorMode = Boolean(cursorId);
    const isTrendingSort = filters.sortBy === 'trending';
    const skip = (page - 1) * limit;
    const shouldApplyLocationIntelligence = !options.disableLocationIntelligence && !isCursorMode;
    const { lat, lng, hasGeo } = (0, adServiceBase_1.normalizeGeoInput)(filters.coordinates ? filters.coordinates.coordinates[1] : filters.lat, filters.coordinates ? filters.coordinates.coordinates[0] : filters.lng);
    const normalizedLevel = typeof filters.level === 'string'
        ? filters.level.toLowerCase()
        : undefined;
    // Country/state level selections must use hierarchical text filters, not radius pins.
    // Even if coordinates exist (they always do from LocationContext), a radius around
    // e.g. New Delhi should NOT be used when the user selected "India" as country.
    const isRegionLevel = normalizedLevel === 'country' || normalizedLevel === 'state';
    const shouldUseGeo = hasGeo && !isRegionLevel;
    const shouldSkipExactCount = shouldUseGeo && !isCursorMode;
    const shouldUseRankScore = isTrendingSort || (shouldUseGeo && !filters.sortBy);
    // Hard-cap radius to prevent full-collection geo scans (DoS protection)
    const MAX_RADIUS_KM = 500;
    const safeRadius = shouldUseGeo
        ? Math.min(Math.max(Number(filters.radiusKm) || 50, 1), MAX_RADIUS_KM)
        : 0;
    const effectiveFilters = { ...filters };
    const locationLabel = typeof filters.location === 'string' ? filters.location.trim() : '';
    if (normalizedLevel === 'state' && !effectiveFilters.state && locationLabel.length > 0) {
        effectiveFilters.state = locationLabel;
    }
    if (normalizedLevel === 'country' && !effectiveFilters.country && locationLabel.length > 0) {
        effectiveFilters.country = locationLabel;
    }
    if (!shouldUseGeo) {
        delete effectiveFilters.lat;
        delete effectiveFilters.lng;
        delete effectiveFilters.radiusKm;
        delete effectiveFilters.coordinates;
    }
    const allowLegacyListingTypeNullCompat = await (0, adServiceBase_1.isEnabled)(adServiceBase_1.FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);
    const pipeline = [];
    let match = {
        ...(await (0, AdSearchService_1.buildAdMatchStage)(effectiveFilters, {
            allowLegacyListingTypeNullCompat,
            trackListingTypeCompatMetrics: options.trackListingTypeCompatMetrics,
            metricContext: 'getAds'
        })),
    };
    if (options.enforcePublicVisibility) {
        adServiceBase_1.logger.info('[FeedVisibility] Applying public visibility guard', {
            viewerId: options.viewerId ?? null
        });
        match = {
            ...match,
            ...(0, adServiceBase_1.buildPublicAdFilter)()
        };
    }
    const blockedSellerIds = await (0, adServiceBase_1.getBlockedSellerIds)(options.viewerId);
    if (blockedSellerIds.length > 0) {
        adServiceBase_1.logger.info('[FeedVisibility] Applying blocked-seller guard', {
            viewerId: options.viewerId,
            blockedSellerCount: blockedSellerIds.length
        });
        const blockedFilter = { sellerId: { $nin: blockedSellerIds } };
        match = Object.keys(match).length > 0
            ? { $and: [match, blockedFilter] }
            : blockedFilter;
    }
    const textSearch = typeof filters.search === 'string' && filters.search.trim().length > 0
        ? filters.search.trim()
        : undefined;
    if (cursorId) {
        const cursorMatch = { _id: { $lt: cursorId } };
        match = Object.keys(match).length > 0 ? { $and: [match, cursorMatch] } : cursorMatch;
    }
    // Geo Filter & Text Search
    if (shouldUseGeo) {
        if (textSearch) {
            match.$text = { $search: textSearch };
        }
        // 🚨 PROTECT PIPELINE 🚨
        // Force-strip any residual text-based location matches that would trigger collection scanning
        delete match['location.city'];
        delete match['location.state'];
        delete match['location.country'];
        delete match['location.display'];
        delete match['location.district'];
        if (Array.isArray(match.$or)) {
            const currentOr = match.$or;
            const filteredOr = currentOr.filter((cond) => {
                return !Object.keys(cond).some(k => k.startsWith('location.'));
            });
            if (filteredOr.length === 0) {
                delete match.$or;
            }
            else {
                match.$or = filteredOr;
            }
        }
        pipeline.push((0, adServiceBase_1.buildGeoNearStage)({
            lng,
            lat,
            radiusKm: safeRadius,
            query: match
        }));
    }
    else {
        if (textSearch) {
            match.$text = { $search: textSearch };
        }
        pipeline.push({ $match: match });
    }
    const countPipeline = isCursorMode ? [] : [...pipeline];
    if (shouldUseRankScore) {
        // Spotlight ads always jump to the front of Pass 1 (Lite Sort)
        const liteSort = { isSpotlight: -1, createdAt: -1 };
        pipeline.push({ $sort: liteSort });
    }
    const sort = (0, AdSearchService_1.buildAdSortStage)({ ...effectiveFilters, search: shouldUseGeo ? undefined : effectiveFilters.search });
    // Final sort for the Top candidates
    if (!shouldUseRankScore) {
        pipeline.push({ $sort: sort });
    }
    if (!isCursorMode && !shouldSkipExactCount) {
        countPipeline.push({ $count: 'total' });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
    }
    else {
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit + 1 });
    }
    // --- DEFERRED HEAVY CALCULATIONS (Post-Pagination) ---
    // Perform complex ranking and lookups only for the final 20 results.
    if (shouldUseRankScore) {
        pipeline.push({
            $lookup: {
                from: 'locationanalytics',
                let: { locationRef: '$location.locationId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$locationId', '$$locationRef'] } } },
                    { $project: { popularityScore: 1, isHotZone: 1 } },
                    { $limit: 1 }
                ],
                as: 'locationAnalytics'
            }
        });
        pipeline.push({
            $addFields: {
                locationAnalytics: { $arrayElemAt: ['$locationAnalytics', 0] },
                hoursSince: {
                    $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60]
                },
                freshnessScore: {
                    $max: [0, { $subtract: [100, { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60] }] }]
                },
                distanceScore: {
                    $cond: [
                        { $ifNull: ['$distance', false] },
                        {
                            $max: [
                                0,
                                {
                                    $subtract: [
                                        100,
                                        { $multiply: [{ $divide: ['$distance', 1000] }, 2] }
                                    ]
                                }
                            ]
                        },
                        0
                    ]
                },
                popularityScore: {
                    $min: [
                        { $ifNull: ['$locationAnalytics.popularityScore', 0] },
                        100
                    ]
                },
                spotlightScore: {
                    $cond: [
                        { $and: [
                                { $eq: ['$isSpotlight', true] },
                                { $gt: ['$spotlightExpiresAt', new Date()] }
                            ] },
                        100,
                        0
                    ]
                },
                engagementScore: {
                    $min: [
                        { $divide: [{ $ifNull: ['$views.total', 0] }, 10] },
                        100
                    ]
                },
                hotZoneBoost: {
                    $cond: [{ $eq: ['$locationAnalytics.isHotZone', true] }, 10, 0]
                }
            }
        });
        pipeline.push({
            $addFields: {
                rankScore: {
                    $add: [
                        { $multiply: ['$distanceScore', 0.4] },
                        { $multiply: ['$freshnessScore', 0.25] },
                        { $multiply: ['$popularityScore', 0.15] },
                        { $multiply: ['$spotlightScore', 0.1] },
                        { $multiply: ['$engagementScore', 0.1] },
                        '$hotZoneBoost',
                        { $multiply: [{ $ifNull: ['$sellerTrustSnapshot', 50] }, 0.05] },
                        { $multiply: [{ $ifNull: ['$listingQualityScore', 0] }, 0.08] },
                        { $multiply: [{ $ifNull: ['$fraudScore', 0] }, -1] }
                    ]
                }
            }
        });
        // Re-sort within the paginated set for perfect recommendation order
        pipeline.push({ $sort: { rankScore: -1, createdAt: -1 } });
    }
    // --- LEAK CLOSURE: DELAYED POPULATION (Post-Pagination) ---
    // Join only the final result set for performance.
    const isLightweightListing = await (0, adServiceBase_1.isEnabled)(adServiceBase_1.FeatureFlag.ENABLE_LIGHTWEIGHT_LISTING);
    // Always join the seller for internal/admin queries regardless of the public feature flag
    const shouldJoinSeller = !isLightweightListing || !options.enforcePublicVisibility;
    if (shouldJoinSeller) {
        // Populate Seller (User DB - Safe for native lookup)
        pipeline.push({
            $lookup: {
                from: 'users',
                let: { refId: '$sellerId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$refId'] } } },
                    { $project: { name: 1, firstName: 1, lastName: 1, phone: 1, mobile: 1, email: 1 } }
                ],
                as: 'seller'
            }
        });
        pipeline.push({ $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } });
        // Remove sensitive seller fields
        pipeline.push({
            $addFields: {
                'seller.password': '$$REMOVE',
                'seller.otp': '$$REMOVE',
                'seller.otpExpiry': '$$REMOVE'
            }
        });
    }
    pipeline.push({
        $project: {
            title: 1,
            price: 1,
            priceMin: 1,
            priceMax: 1,
            diagnosticFee: 1,
            images: 1,
            description: 1,
            location: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            views: 1,
            categoryId: 1,
            brandId: 1,
            modelId: 1,
            sellerId: 1,
            listingType: 1,
            planType: 1,
            isSpotlight: 1,
            spotlightExpiresAt: 1,
            expiresAt: 1,
            publishedAt: 1,
            approvedAt: 1,
            soldAt: 1,
            rejectionReason: 1,
            fraudScore: 1,
            moderationStatus: 1,
            distance: 1,
            distanceKm: { $cond: [{ $ifNull: ['$distance', false] }, { $divide: ['$distance', 1000] }, null] },
            rankScore: 1,
            distanceScore: 1,
            freshnessScore: 1,
            popularityScore: 1,
            sellerTrustSnapshot: 1,
            listingQualityScore: 1,
            onsiteService: 1,
            turnaroundTime: 1,
            warranty: 1,
            included: 1,
            excluded: 1,
            serviceTypeIds: 1,
            sparePartId: 1,
            condition: 1,
            stock: 1,
            deviceType: 1,
            deviceCondition: 1,
            sparePartsSnapshot: 1,
            sparePartIds: 1,
            // Include populated fields (if lookups were performed)
            category: 1,
            brand: 1,
            model: 1,
            seller: 1,
            spareParts: 1
        }
    });
    const [rawResults, countResult] = await Promise.all([
        adServiceBase_1.Ad.aggregate(pipeline),
        isCursorMode || shouldSkipExactCount
            ? Promise.resolve([])
            : adServiceBase_1.Ad.aggregate(countPipeline),
    ]);
    const useCursorStyleMeta = isCursorMode || shouldSkipExactCount;
    const hasMore = useCursorStyleMeta ? rawResults.length > limit : false;
    const results = useCursorStyleMeta ? rawResults.slice(0, limit) : rawResults;
    // --- HYDRATION: Application-level joins for cross-database metadata ---
    // We always hydrate for non-public (admin/moderation) queries even if lightweight mode is on.
    const shouldHydrateMetadata = !isLightweightListing || !options.enforcePublicVisibility;
    if (shouldHydrateMetadata) {
        await hydrateAdMetadata(results);
    }
    const nextCursor = useCursorStyleMeta && hasMore && results.length > 0
        ? String(results[results.length - 1]?._id || '')
        : undefined;
    const total = useCursorStyleMeta ? results.length : countResult[0]?.total || 0;
    const data = results.map(ad => {
        const serializedAd = (0, adServiceBase_1.serializeDoc)(ad);
        if (serializedAd.location) {
            serializedAd.location = (0, adServiceBase_1.normalizeLocationResponse)(serializedAd.location);
        }
        return (0, adServiceBase_1.normalizeAdImagesForResponse)(serializedAd);
    });
    const hasLocationContext = Boolean(hasGeo ||
        effectiveFilters.locationId ||
        effectiveFilters.location ||
        effectiveFilters.district ||
        effectiveFilters.state ||
        effectiveFilters.country ||
        effectiveFilters.level);
    if (hasLocationContext && !options.disableLocationIntelligence) {
        const trackedLocationIds = Array.from(new Set([
            typeof effectiveFilters.locationId === 'string' ? effectiveFilters.locationId : null,
            ...data.map((ad) => (0, adServiceBase_1.extractLocationIdFromAd)(ad))
        ].filter((value) => Boolean(value))));
        if (trackedLocationIds.length > 0) {
            setImmediate(() => {
                (0, adServiceBase_1.touchLocationSearchAnalytics)(trackedLocationIds).catch((error) => {
                    adServiceBase_1.logger.warn('Failed to update location_search analytics for ad query', {
                        locationIds: trackedLocationIds,
                        error: error instanceof Error ? error.message : String(error)
                    });
                });
            });
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Location-intelligence fallback — L1 → L2 → L3 → L4 hierarchy
    //
    //  L1  Already executed above: $geoNear at user's pin (safeRadius km)
    //  L2  Exact locationId match (same city / area document in Location coll.)
    //  L3  location.state string match (same state, no radius bound)
    //  L4  No location filter (all-India / global)
    //
    // Each level is only triggered when the running result set < minimumTarget.
    // `locationHierarchyLevel` is added to meta so the frontend can render
    // e.g. "Showing ads from: Maharashtra" or "Showing ads from: India".
    // ─────────────────────────────────────────────────────────────────────────
    if (shouldApplyLocationIntelligence &&
        shouldUseGeo &&
        !isCursorMode &&
        !filters.radiusKm) {
        const minimumTarget = Math.min(limit, 10);
        const mergedById = new Map();
        let locationHierarchyLevel = 'L1';
        const mergeAds = (items) => {
            for (const item of items) {
                const key = String(item.id || item._id || '');
                if (!key || mergedById.has(key))
                    continue;
                mergedById.set(key, item);
            }
        };
        mergeAds(data); // L1 results already in `data`
        const fetchMore = async (nextFilters) => {
            const remaining = Math.max(limit - mergedById.size, 1);
            if (remaining <= 0)
                return;
            const response = await (0, exports.getAds)({
                ...nextFilters,
                excludeIds: Array.from(mergedById.keys())
            }, { page: 1, limit: remaining }, {
                ...options,
                disableLocationIntelligence: true
            });
            mergeAds(response.data);
        };
        // ── L2: exact city / area by locationId ──────────────────────────────
        if (mergedById.size < minimumTarget && effectiveFilters.locationId) {
            locationHierarchyLevel = 'L2';
            await fetchMore({
                status: filters.status,
                locationId: effectiveFilters.locationId,
                categoryId: effectiveFilters.categoryId,
                sortBy: 'newest',
            });
        }
        // ── L3: same state (text field match on location.state) ──────────────
        if (mergedById.size < minimumTarget && effectiveFilters.state) {
            locationHierarchyLevel = 'L3';
            await fetchMore({
                status: filters.status,
                state: effectiveFilters.state,
                categoryId: effectiveFilters.categoryId,
                sortBy: 'newest',
            });
        }
        // ── L4: all-India (no location constraint) ───────────────────────────
        if (mergedById.size < minimumTarget) {
            locationHierarchyLevel = 'L4';
            await fetchMore({
                status: filters.status,
                categoryId: effectiveFilters.categoryId,
                sortBy: 'newest',
            });
        }
        const merged = Array.from(mergedById.values());
        merged.sort((left, right) => {
            const leftScore = Number(left.rankScore ?? 0);
            const rightScore = Number(right.rankScore ?? 0);
            if (shouldUseRankScore && rightScore !== leftScore) {
                return rightScore - leftScore;
            }
            if (filters.sortBy === 'price-low') {
                return Number(left.price || 0) - Number(right.price || 0);
            }
            if (filters.sortBy === 'price-high') {
                return Number(right.price || 0) - Number(left.price || 0);
            }
            const leftCreated = new Date(String(left.createdAt || 0)).getTime();
            const rightCreated = new Date(String(right.createdAt || 0)).getTime();
            return rightCreated - leftCreated;
        });
        const limited = merged.slice(0, limit);
        // Telemetry Hardening: Log distribution of location expansion
        adServiceBase_1.logger.info('[AdAggregationService] Location intelligence fallback applied', {
            locationHierarchyLevel,
            totalFound: merged.length,
            targetSize: limit,
            minimumTarget,
            searchState: effectiveFilters.state,
            searchLocationId: effectiveFilters.locationId,
            effectiveRadiusKm: safeRadius
        });
        return {
            data: limited,
            meta: {
                effectiveRadiusKm: safeRadius,
                locationHierarchyLevel
            },
            pagination: {
                page,
                limit,
                hasMore: merged.length > limit,
                nextCursor: merged.length > limit
                    ? String(limited[limited.length - 1]?.id ||
                        limited[limited.length - 1]?._id ||
                        '')
                    : undefined,
                cursor: cursor || null
            }
        };
    }
    const finalResponse = {
        data,
        meta: {
            effectiveRadiusKm: shouldUseGeo ? safeRadius : undefined,
        },
        pagination: {
            page,
            limit,
            ...(useCursorStyleMeta
                ? {
                    hasMore,
                    nextCursor,
                    cursor: cursor || null
                }
                : {
                    total,
                    hasMore: total > page * limit,
                    totalPages: Math.ceil(total / limit),
                }),
        }
    };
    // --- Ranking Telemetry Logging ---
    // Sample 5% of searches
    if (Math.random() < 0.05 && finalResponse.data && finalResponse.data.length > 0) {
        setImmediate(() => {
            try {
                const eventId = (0, adServiceBase_1.uuidv4)();
                const telemetryDocs = finalResponse.data.slice(0, 10).map((ad, index) => ({
                    eventId,
                    adId: ad.id || ad._id,
                    position: index + 1,
                    rankScore: ad.rankScore || 0,
                    components: {
                        qualityScore: ad.listingQualityScore || 0,
                        distanceScore: ad.distanceScore || 0,
                        freshnessScore: ad.freshnessScore || 0,
                        popularityScore: ad.popularityScore || 0,
                        sellerTrust: ad.sellerTrustSnapshot || 50
                    }
                }));
                adServiceBase_1.RankingTelemetry.insertMany(telemetryDocs).catch((err) => {
                    adServiceBase_1.logger.warn('Failed to insert ranking telemetry', { error: err.message });
                });
            }
            catch (error) {
                adServiceBase_1.logger.warn('Ranking telemetry error', { error: error instanceof Error ? error.message : String(error) });
            }
        });
    }
    return finalResponse;
};
exports.getAds = getAds;
// ─────────────────────────────────────────────────
// AD COUNTS
// ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────
// SHIMS (Backward Compatibility)
// ─────────────────────────────────────────────────
/**
 * @deprecated Suggestions flow has been refactored
 */
const getListingSuggestions = async (query) => {
    void query;
    return []; // Return empty array to satisfy contract without breaking runtime
};
exports.getListingSuggestions = getListingSuggestions;
//# sourceMappingURL=AdAggregationService.js.map