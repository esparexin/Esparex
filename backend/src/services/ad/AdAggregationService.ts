import mongoose, { PipelineStage } from 'mongoose';
import Ad from '../../models/Ad';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import ProductModel from '../../models/Model';
import Business from '../../models/Business';
import Report from '../../models/Report';
import BlockedUser from '../../models/BlockedUser';
import SparePart from '../../models/SparePart';
import { serializeDoc } from '../../utils/serialize';
import { normalizeLocationResponse } from '../location/LocationNormalizer';
import { touchLocationSearchAnalytics } from '../location/LocationAnalyticsService';
import { buildGeoNearStage, normalizeGeoInput } from '../../utils/GeoUtils';
import { normalizeAdStatus } from '../adStatusService';
import { buildAdFilterFromCriteria, AdFilterCriteria } from '../../utils/adFilterHelper';
import { getCache, setCache } from '../../utils/redisCache';
import { buildPublicAdFilter } from '../../utils/FeedVisibilityGuard';
import { type ListingTypeValue } from '../../../../shared/enums/listingType';
import logger from '../../utils/logger';
import RankingTelemetry from '../../models/RankingTelemetry';
import { v4 as uuidv4 } from 'uuid';
import { escapeRegExp } from '../../utils/stringUtils';
import {
    buildAdSortStage as buildAdSortStageFromHelper,
    extractLocationIdFromAd,
    normalizeAdImagesForResponse,
    type SortStage
} from '../adQuery/AdQueryHelpers';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { FeatureFlag, isEnabled } from '../../config/featureFlags';
import AdminMetrics from '../../models/AdminMetrics';
import { isBusinessPublishedStatus } from '../../utils/businessStatus';

import { 
    AdsListResult, 
    AdFilters, 
    getBlockedSellerIds, 
    recordListingTypeCompatMetric, 
    AD_DETAIL_CACHE_TTL_SECONDS,
    UnknownRecord,
    AggregationStage,
    ListingTypeCompatMetricContext,
    ListingTypeFilterBuildResult,
    BuildAdMatchStageOptions,
    PaginationOptions,
    PublicQueryOptions,
    buildListingTypeFilter
} from './_shared/adFilterHelpers';

import { buildAdMatchStage, buildAdSortStage } from './AdSearchService';

export interface HydratedAd {
    _id?: mongoose.Types.ObjectId | string;
    id?: string;
    categoryId?: mongoose.Types.ObjectId | string;
    brandId?: mongoose.Types.ObjectId | string;
    modelId?: mongoose.Types.ObjectId | string;
    sparePartId?: mongoose.Types.ObjectId | string;
    sparePartIds?: (mongoose.Types.ObjectId | string)[];
    serviceTypeIds?: (mongoose.Types.ObjectId | string)[];
    category?: any;
    categoryName?: string;
    brand?: any;
    model?: any;
    sparePart?: any;
    spareParts?: any[];
    serviceTypes?: any[];
    [key: string]: any; // Relaxed for Mongoose Document & Aggregate compatibility
}

export async function hydrateAdMetadata(ads: HydratedAd[]) {
    if (!ads || ads.length === 0) return ads;

    const categoryIds = new Set<string>();
    const brandIds = new Set<string>();
    const modelIds = new Set<string>();
    const sparePartIds = new Set<string>();
    const serviceTypeIds = new Set<string>();

    ads.forEach(ad => {
        if (ad.categoryId) categoryIds.add(ad.categoryId.toString());
        if (ad.brandId) brandIds.add(ad.brandId.toString());
        if (ad.modelId) modelIds.add(ad.modelId.toString());
        if (ad.sparePartId) sparePartIds.add(ad.sparePartId.toString());
        if (Array.isArray(ad.sparePartIds)) {
            ad.sparePartIds.forEach((id: string | mongoose.Types.ObjectId) => sparePartIds.add(id.toString()));
        }
        if (Array.isArray(ad.serviceTypeIds)) {
            ad.serviceTypeIds.forEach((id: string | mongoose.Types.ObjectId) => serviceTypeIds.add(id.toString()));
        }
    });

    const [categories, brands, models, spareParts, serviceTypes] = await Promise.all([
        categoryIds.size > 0 
            ? Category.find({ _id: { $in: Array.from(categoryIds) } }).select('name slug').lean() 
            : Promise.resolve([]),
        brandIds.size > 0 
            ? Brand.find({ _id: { $in: Array.from(brandIds) } }).select('name slug').lean() 
            : Promise.resolve([]),
        modelIds.size > 0 
            ? ProductModel.find({ _id: { $in: Array.from(modelIds) } }).select('name slug').lean() 
            : Promise.resolve([]),
        sparePartIds.size > 0 
            ? SparePart.find({ _id: { $in: Array.from(sparePartIds) } }).lean() 
            : Promise.resolve([]),
        serviceTypeIds.size > 0
            ? (await import('../../models/ServiceType')).default.find({ _id: { $in: Array.from(serviceTypeIds) } }).select('name').lean()
            : Promise.resolve([])
    ]);

    const categoryMap = new Map<string, any>(categories.map((c: any) => [String(c._id), c]));
    const brandMap = new Map<string, any>(brands.map((b: any) => [String(b._id), b]));
    const modelMap = new Map<string, any>(models.map((m: any) => [String(m._id), m]));
    const sparePartMap = new Map<string, any>(spareParts.map((s: any) => [String(s._id), s]));
    const serviceTypeMap = new Map<string, any>(serviceTypes.map((st: any) => [String(st._id), st]));

    ads.forEach(ad => {
        if (ad.categoryId) {
            const cat = categoryMap.get(String(ad.categoryId));
            ad.category = cat;
            // Flat string field — reliable label even if object hydration is partial
            if (cat && typeof (cat as { name?: string }).name === 'string') {
                ad.categoryName = (cat as { name: string }).name;
            }
        }
        if (ad.brandId) {
            ad.brand = brandMap.get(String(ad.brandId));
        }
        if (ad.modelId) {
            ad.model = modelMap.get(String(ad.modelId));
        }
        if (ad.sparePartId) {
            ad.sparePart = sparePartMap.get(String(ad.sparePartId));
        }
        if (Array.isArray(ad.sparePartIds)) {
            ad.spareParts = ad.sparePartIds
                .map((id: string | mongoose.Types.ObjectId) => sparePartMap.get(String(id)))
                .filter(Boolean);
        }
        if (Array.isArray(ad.serviceTypeIds)) {
            ad.serviceTypes = ad.serviceTypeIds
                .map((id: string | mongoose.Types.ObjectId) => serviceTypeMap.get(String(id)))
                .filter(Boolean);
        }
    });

    return ads;
}

export const getAds = async (
    filters: AdFilters,
    pagination: PaginationOptions,
    options: PublicQueryOptions = {}
): Promise<AdsListResult> => {
    const { page, limit, cursor } = pagination;
    const cursorId =
        typeof cursor === 'string' && mongoose.Types.ObjectId.isValid(cursor)
            ? new mongoose.Types.ObjectId(cursor)
            : null;
    const isCursorMode = Boolean(cursorId);
    const isTrendingSort = filters.sortBy === 'trending';
    const skip = (page - 1) * limit;
    const shouldApplyLocationIntelligence =
        !options.disableLocationIntelligence && !isCursorMode;

    const { lat, lng, hasGeo } = normalizeGeoInput(
        filters.coordinates ? filters.coordinates.coordinates[1] : filters.lat,
        filters.coordinates ? filters.coordinates.coordinates[0] : filters.lng
    );
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

    const effectiveFilters: AdFilters = { ...filters };
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

    const allowLegacyListingTypeNullCompat = await isEnabled(FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);

    const pipeline: AggregationStage[] = [];
    let match: UnknownRecord = {
        ...(await buildAdMatchStage(effectiveFilters, {
            allowLegacyListingTypeNullCompat,
            trackListingTypeCompatMetrics: options.trackListingTypeCompatMetrics,
            metricContext: 'getAds'
        })),
    };
    if (options.enforcePublicVisibility) {
        logger.info('[FeedVisibility] Applying public visibility guard', {
            viewerId: options.viewerId ?? null
        });
        match = {
            ...match,
            ...buildPublicAdFilter()
        };
    }

    const blockedSellerIds = await getBlockedSellerIds(options.viewerId);
    if (blockedSellerIds.length > 0) {
        logger.info('[FeedVisibility] Applying blocked-seller guard', {
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
            const currentOr = match.$or as UnknownRecord[];
            const filteredOr = currentOr.filter((cond: UnknownRecord) => {
                return !Object.keys(cond).some(k => k.startsWith('location.'));
            });
            if (filteredOr.length === 0) {
                delete match.$or;
            } else {
                match.$or = filteredOr;
            }
        }

        pipeline.push(buildGeoNearStage({
            lng,
            lat,
            radiusKm: safeRadius,
            query: match
        }));
    } else {
        if (textSearch) {
            match.$text = { $search: textSearch };
        }
        pipeline.push({ $match: match });
    }



    const countPipeline: AggregationStage[] = isCursorMode ? [] : [...pipeline];

    if (shouldUseRankScore) {
        // Location-intelligence scoring: distance + freshness + popularity + promotion + engagement.
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
                locationAnalytics: { $arrayElemAt: ['$locationAnalytics', 0] }
            }
        });

        pipeline.push({
            $addFields: {
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
                        ]}, 
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
    }

    const sort = shouldUseRankScore
        ? ({ rankScore: -1, createdAt: -1 } as SortStage)
        : buildAdSortStage({ ...effectiveFilters, search: shouldUseGeo ? undefined : effectiveFilters.search });
    pipeline.push({ $sort: sort });

    if (!isCursorMode && !shouldSkipExactCount) {
        countPipeline.push({ $count: 'total' });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
    } else {
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit + 1 });
    }

    // --- LEAK CLOSURE: DELAYED POPULATION (Post-Pagination) ---
    // Join only the final result set for performance.
    const isLightweightListing = await isEnabled(FeatureFlag.ENABLE_LIGHTWEIGHT_LISTING);

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
                'seller.otpExpiry': '$$REMOVE' as unknown
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
        Ad.aggregate(pipeline),
        isCursorMode || shouldSkipExactCount
            ? Promise.resolve([] as Array<{ total: number }>)
            : Ad.aggregate(countPipeline),
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
    const nextCursor =
        useCursorStyleMeta && hasMore && results.length > 0
            ? String(results[results.length - 1]?._id || '')
            : undefined;
    const total = useCursorStyleMeta ? results.length : countResult[0]?.total || 0;

    const data = results.map(ad => {
        const serializedAd = serializeDoc(ad) as HydratedAd;
        if (serializedAd.location) {
            serializedAd.location = normalizeLocationResponse(serializedAd.location as Record<string, unknown>);
        }
        return normalizeAdImagesForResponse(serializedAd);
    });

    const hasLocationContext = Boolean(
        hasGeo ||
        effectiveFilters.locationId ||
        effectiveFilters.location ||
        effectiveFilters.district ||
        effectiveFilters.state ||
        effectiveFilters.country ||
        effectiveFilters.level
    );
    if (hasLocationContext && !options.disableLocationIntelligence) {
        const trackedLocationIds = Array.from(
            new Set(
                [
                    typeof effectiveFilters.locationId === 'string' ? effectiveFilters.locationId : null,
                    ...data.map((ad) => extractLocationIdFromAd(ad))
                ].filter((value): value is string => Boolean(value))
            )
        );

        if (trackedLocationIds.length > 0) {
            setImmediate(() => {
                touchLocationSearchAnalytics(trackedLocationIds).catch((error) => {
                    logger.warn('Failed to update location_search analytics for ad query', {
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
    if (
        shouldApplyLocationIntelligence &&
        shouldUseGeo &&
        !isCursorMode &&
        !filters.radiusKm
    ) {
        const minimumTarget = Math.min(limit, 10);
        const mergedById = new Map<string, Record<string, unknown>>();
        let locationHierarchyLevel: 'L1' | 'L2' | 'L3' | 'L4' = 'L1';

        const mergeAds = (items: Array<Record<string, unknown>>) => {
            for (const item of items) {
                const key = String(item.id || item._id || '');
                if (!key || mergedById.has(key)) continue;
                mergedById.set(key, item);
            }
        };

        mergeAds(data); // L1 results already in `data`

        const fetchMore = async (nextFilters: AdFilters) => {
            const remaining = Math.max(limit - mergedById.size, 1);
            if (remaining <= 0) return;
            const response = await getAds(
                {
                    ...nextFilters,
                    excludeIds: Array.from(mergedById.keys())
                },
                { page: 1, limit: remaining },
                {
                    ...options,
                    disableLocationIntelligence: true
                }
            );
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
            const leftScore = Number((left as { rankScore?: unknown }).rankScore ?? 0);
            const rightScore = Number((right as { rankScore?: unknown }).rankScore ?? 0);
            if (shouldUseRankScore && rightScore !== leftScore) {
                return rightScore - leftScore;
            }
            if (filters.sortBy === 'price-low') {
                return Number((left as { price?: unknown }).price || 0) - Number((right as { price?: unknown }).price || 0);
            }
            if (filters.sortBy === 'price-high') {
                return Number((right as { price?: unknown }).price || 0) - Number((left as { price?: unknown }).price || 0);
            }
            const leftCreated = new Date(String((left as { createdAt?: unknown }).createdAt || 0)).getTime();
            const rightCreated = new Date(String((right as { createdAt?: unknown }).createdAt || 0)).getTime();
            return rightCreated - leftCreated;
        });

        const limited = merged.slice(0, limit);
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
                    ? String(
                        (limited[limited.length - 1] as { id?: unknown; _id?: unknown })?.id ||
                        (limited[limited.length - 1] as { id?: unknown; _id?: unknown })?._id ||
                        ''
                    )
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
                const eventId = uuidv4();
                const telemetryDocs = (finalResponse.data as any[]).slice(0, 10).map((ad: Record<string, any>, index: number) => ({
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
                RankingTelemetry.insertMany(telemetryDocs).catch((err: Error) => {
                    logger.warn('Failed to insert ranking telemetry', { error: err.message });
                });
            } catch (error) {
                logger.warn('Ranking telemetry error', { error: error instanceof Error ? error.message : String(error) });
            }
        });
    }

    return finalResponse;
};

// ─────────────────────────────────────────────────
// AD COUNTS
// ─────────────────────────────────────────────────

