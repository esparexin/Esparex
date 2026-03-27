/**
 * Ad Query Service
 * Handles ad searching, filtering, and listing operations
 *
 * Extracted from adService.ts for better separation of concerns
 */

import mongoose, { ClientSession, PipelineStage } from 'mongoose';
import Ad from '../models/Ad';
import Category from '../models/Category';
import Brand from '../models/Brand';
import ProductModel from '../models/Model';
import Report from '../models/Report';
import BlockedUser from '../models/BlockedUser';
import SparePart from '../models/SparePart';
import { serializeDoc } from '../utils/serialize';
import { normalizeLocationResponse, touchLocationSearchAnalytics } from './LocationService';
import { buildGeoNearStage, normalizeGeoInput } from '../utils/GeoUtils';
import { normalizeAdStatus } from './adStatusService';
import { buildAdFilterFromCriteria, AdFilterCriteria } from '../utils/adFilterHelper';
import { getCache, setCache, CACHE_TTLS } from '../utils/redisCache';
import type { HomeAdsResponse } from '../../../shared/types/Api';
import { buildPublicAdFilter } from '../utils/FeedVisibilityGuard';
import { type ListingTypeValue } from '../../../shared/enums/listingType';
import logger from '../utils/logger';
import RankingTelemetry from '../models/RankingTelemetry';
import { v4 as uuidv4 } from 'uuid';
import { escapeRegExp } from '../utils/stringUtils';
import {
    buildAdSortStage as buildAdSortStageFromHelper,
    extractLocationIdFromAd,
    normalizeAdImagesForResponse,
    type SortStage
} from './adQuery/AdQueryHelpers';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { FeatureFlag, isEnabled } from '../config/featureFlags';
import AdminMetrics from '../models/AdminMetrics';

// ─────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────

export interface AdFilters {
    search?: string;
    status?: string | string[];
    category?: string;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerId?: string;
    locationId?: string;
    level?: 'country' | 'state' | 'district' | 'city' | 'area' | 'village';
    district?: string;
    state?: string;
    country?: string;
    location?: string;
    lat?: number | string;
    lng?: number | string;
    radiusKm?: number;
    sparePartId?: string | mongoose.Types.ObjectId;
    coordinates?: {
        type: 'Point';
        coordinates: [number, number];
    };
    sortBy?: string;
    planType?: string;
    isSpotlight?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    flagged?: boolean;
    reportThreshold?: number;
    riskThreshold?: number;
    excludeIds?: string[];
    isDeleted?: { $ne: boolean };
    expiresAt?: { $gt: Date };
    priceMin?: number;
    priceMax?: number;
    onsiteService?: boolean;
    /** Filter by Ad record listingType. Use the `categoryEnumToRecord` helper if mapping from Category capability enums. */
    listingType?: ListingTypeValue | ListingTypeValue[];
}

export interface PaginationOptions {
    page: number;
    limit: number;
    cursor?: string;
}

export interface PublicQueryOptions {
    enforcePublicVisibility?: boolean;
    disableLocationIntelligence?: boolean;
    viewerId?: string;
    trackListingTypeCompatMetrics?: boolean;
}

export interface PublicAdViewer {
    userId?: string;
    role?: string;
    isAdmin?: boolean;
}

type UnknownRecord = Record<string, unknown>;
type AggregationStage = PipelineStage;
type ListingTypeCompatMetricContext = 'getAds' | 'getAdCounts';

type ListingTypeFilterBuildResult = {
    filter: Record<string, unknown> | string;
    compatibilityApplied: boolean;
};

type BuildAdMatchStageOptions = {
    allowLegacyListingTypeNullCompat?: boolean;
    trackListingTypeCompatMetrics?: boolean;
    metricContext?: ListingTypeCompatMetricContext;
};

const buildListingTypeFilter = (
    listingType: AdFilters['listingType'],
    allowLegacyListingTypeNullCompat: boolean
): ListingTypeFilterBuildResult | undefined => {
    if (!listingType) return undefined;

    if (Array.isArray(listingType)) {
        const values = [...listingType];
        // Legacy rows can miss listingType; treat them as "ad" during transition.
        if (allowLegacyListingTypeNullCompat && values.includes('ad')) {
            return {
                filter: { $in: [...values, null] },
                compatibilityApplied: true
            };
        }
        return {
            filter: { $in: values },
            compatibilityApplied: false
        };
    }

    if (allowLegacyListingTypeNullCompat && listingType === 'ad') {
        // `{ $in: ['ad', null] }` matches explicit "ad" and missing/null legacy rows.
        return {
            filter: { $in: ['ad', null] },
            compatibilityApplied: true
        };
    }

    return {
        filter: listingType,
        compatibilityApplied: false
    };
};

const LISTINGTYPE_COMPAT_METRIC_MODULE = 'ad_listingtype_compat';

const normalizeMetricSegment = (value: string): string =>
    value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';

const recordListingTypeCompatMetric = async (
    context: ListingTypeCompatMetricContext,
    listingType: AdFilters['listingType']
): Promise<void> => {
    try {
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        const filterLabelRaw = Array.isArray(listingType)
            ? listingType.join('_')
            : String(listingType ?? 'unknown');
        const filterLabel = normalizeMetricSegment(filterLabelRaw);

        await AdminMetrics.findOneAndUpdate(
            { metricModule: LISTINGTYPE_COMPAT_METRIC_MODULE, aggregationDate: date },
            {
                $inc: {
                    'payload.total': 1,
                    [`payload.context.${context}`]: 1,
                    [`payload.filters.${filterLabel}`]: 1
                }
            },
            { upsert: true }
        );
    } catch (error) {
        logger.warn('Failed to record listingType compatibility metric', {
            context,
            listingType,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export interface AdsListResult {
    data: Array<Record<string, unknown>>;
    meta?: {
        effectiveRadiusKm?: number;
        /** Which fallback level resolved the feed. L1=geo, L2=city, L3=state, L4=India */
        locationHierarchyLevel?: 'L1' | 'L2' | 'L3' | 'L4';
    };
    pagination: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasMore?: boolean;
        nextCursor?: string;
        cursor?: string | null;
    };
}

const AD_DETAIL_CACHE_TTL_SECONDS = 300;

const getBlockedSellerIds = async (viewerId?: string): Promise<mongoose.Types.ObjectId[]> => {
    if (!viewerId || !mongoose.Types.ObjectId.isValid(viewerId)) return [];

    const records = await BlockedUser.find({
        blockerId: new mongoose.Types.ObjectId(viewerId),
    })
        .select('blockedId')
        .lean<Array<{ blockedId: mongoose.Types.ObjectId }>>();

    const deduped = new Set<string>();
    const blockedIds: mongoose.Types.ObjectId[] = [];
    for (const record of records) {
        const id = record?.blockedId;
        if (!id) continue;
        const str = String(id);
        if (deduped.has(str)) continue;
        deduped.add(str);
        blockedIds.push(id);
    }

    return blockedIds;
};

// ─────────────────────────────────────────────────
// FILTER & SORT BUILDERS (Helper Functions)
// ─────────────────────────────────────────────────

/**
 * CONSOLIDATION PLAN: buildAdMatchStage and buildAdFilterFromCriteria overlap. Align them into a single AdCriteriaTransformer utility to reduce logic drift.
 */
export const buildAdMatchStage = async (
    filters: AdFilters,
    options: BuildAdMatchStageOptions = {}
): Promise<UnknownRecord> => {
    const allowLegacyListingTypeNullCompat = options.allowLegacyListingTypeNullCompat
        ?? await isEnabled(FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);

    if (!filters.status) {
        filters.status = AD_STATUS.LIVE;
    }

    let resolvedCategoryId = filters.categoryId;
    const legacyCategory = typeof filters.category === 'string' ? filters.category.trim() : '';
    if (!resolvedCategoryId && legacyCategory) {
        if (mongoose.Types.ObjectId.isValid(legacyCategory)) {
            resolvedCategoryId = legacyCategory;
        } else {
            const resolvedCategory = await Category.findOne({
                isDeleted: { $ne: true },
                isActive: true,
                $or: [
                    { slug: legacyCategory.toLowerCase() },
                    { name: new RegExp(`^${escapeRegExp(legacyCategory)}$`, 'i') }
                ]
            }).select('_id').lean<{ _id: mongoose.Types.ObjectId } | null>();
            resolvedCategoryId = resolvedCategory?._id?.toString();
        }
    }

    const requestedStatus = filters.status || AD_STATUS.LIVE;
    const { getStatusMatchCriteria } = await import('../utils/statusQueryMapper');
    const statusQuery = getStatusMatchCriteria(requestedStatus as string | string[]);

    let match = buildAdFilterFromCriteria({
        ...filters,
        lat: filters.lat,
        lng: filters.lng,
        categoryId: resolvedCategoryId,
        keywords: filters.search, // Map 'search' to 'keywords' for the helper
        location: filters.location,
        status: statusQuery
    } as AdFilterCriteria & { lat?: number | string; lng?: number | string; });

    if (filters.isDeleted) {
        match.isDeleted = filters.isDeleted;
    }
    if (filters.expiresAt) {
        match.expiresAt = filters.expiresAt;
    }

    // listingType — ad | service | spare_part
    if (filters.listingType) {
        const listingTypeFilterResult = buildListingTypeFilter(filters.listingType, allowLegacyListingTypeNullCompat);
        if (listingTypeFilterResult !== undefined) {
            match.listingType = listingTypeFilterResult.filter;
            if (listingTypeFilterResult.compatibilityApplied && options.trackListingTypeCompatMetrics && options.metricContext) {
                setImmediate(() => {
                    void recordListingTypeCompatMetric(options.metricContext as ListingTypeCompatMetricContext, filters.listingType);
                });
            }
        }
    }

    // Spare Part Specific Filter
    if (filters.sparePartId && mongoose.Types.ObjectId.isValid(String(filters.sparePartId))) {
        match.sparePartIds = new mongoose.Types.ObjectId(String(filters.sparePartId));
    }

    if (Array.isArray(filters.excludeIds) && filters.excludeIds.length > 0) {
        const excludedObjectIds = filters.excludeIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));
        if (excludedObjectIds.length > 0) {
            match._id = { ...(match._id as UnknownRecord || {}), $nin: excludedObjectIds };
        }
    }

    // Admin moderation flagged filter: include ads with elevated fraud/duplicate
    // signals and/or ads crossing a report-count threshold.
    // Cache key uses reportThreshold as part of key so different thresholds stay isolated.
    if (filters.flagged === true) {
        const riskThreshold = Number.isFinite(Number(filters.riskThreshold))
            ? Number(filters.riskThreshold)
            : 70;
        const reportThreshold = Number.isFinite(Number(filters.reportThreshold))
            ? Number(filters.reportThreshold)
            : 2;

        // Cache the expensive Report aggregation (compound index adId+status already exists)
        const cacheKey = `admin:flagged_report_ids:${reportThreshold}`;
        let reportedAdIds: mongoose.Types.ObjectId[] = [];

        const cachedIds = await getCache<string[]>(cacheKey);
        if (cachedIds) {
            reportedAdIds = cachedIds
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
                .map((id) => new mongoose.Types.ObjectId(id));
        } else {
            const reportGroups = await Report.aggregate<{ _id: mongoose.Types.ObjectId }>([
                { $match: { status: { $in: ['open', 'pending', 'reviewed'] } } },
                { $group: { _id: '$adId', reportCount: { $sum: 1 } } },
                { $match: { reportCount: { $gte: reportThreshold } } },
                { $project: { _id: 1 } }
            ]);
            reportedAdIds = reportGroups.map((group) => group._id);
            // 60s freshness is acceptable for admin moderation views
            await setCache(cacheKey, reportedAdIds.map((id) => id.toString()), 60);
        }

        const flaggedOr: UnknownRecord[] = [
            { fraudScore: { $gte: riskThreshold } },
            { isDuplicateFlag: true }
        ];
        if (reportedAdIds.length > 0) {
            flaggedOr.push({ _id: { $in: reportedAdIds } });
        }

        match = Object.keys(match).length > 0
            ? { $and: [match, { $or: flaggedOr }] }
            : { $or: flaggedOr };
    }

    return match;
};

export const buildAdSortStage = (filters: AdFilters): SortStage => buildAdSortStageFromHelper(filters);



// ─────────────────────────────────────────────────
// COMPLEX SEARCH (Full aggregation with geo support)
// ─────────────────────────────────────────────────

/**
 * Hydrates a list of ad documents with metadata from the Admin database.
 * This performs application-level joins for Category, Brand, Model, and SparePart
 * collections that reside on the Admin connection, bypassing MongoDB $lookup limitations.
 */
export async function hydrateAdMetadata(ads: any[]) {
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
            ad.sparePartIds.forEach((id: any) => sparePartIds.add(id.toString()));
        }
        if (Array.isArray(ad.serviceTypeIds)) {
            ad.serviceTypeIds.forEach((id: any) => serviceTypeIds.add(id.toString()));
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
            ? (await import('../models/ServiceType')).default.find({ _id: { $in: Array.from(serviceTypeIds) } }).select('name').lean()
            : Promise.resolve([])
    ]);

    const categoryMap = new Map(categories.map((c: any) => [String(c._id), c]));
    const brandMap = new Map(brands.map((b: any) => [String(b._id), b]));
    const modelMap = new Map(models.map((m: any) => [String(m._id), m]));
    const sparePartMap = new Map(spareParts.map((s: any) => [String(s._id), s]));
    const serviceTypeMap = new Map(serviceTypes.map((st: any) => [String(st._id), st]));

    ads.forEach(ad => {
        if (ad.categoryId) {
            ad.category = categoryMap.get(String(ad.categoryId));
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
                .map((id: any) => sparePartMap.get(String(id)))
                .filter(Boolean);
        }
        if (Array.isArray(ad.serviceTypeIds)) {
            ad.serviceTypes = ad.serviceTypeIds
                .map((id: any) => serviceTypeMap.get(String(id)))
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
        const serializedAd = serializeDoc(ad) as Record<string, any>;
        if (serializedAd.location) {
            serializedAd.location = normalizeLocationResponse(serializedAd.location);
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
                const telemetryDocs = finalResponse.data.slice(0, 10).map((ad: any, index: number) => ({
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
                RankingTelemetry.insertMany(telemetryDocs).catch((err: any) => {
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

export const getAdCounts = async (
    filters: AdFilters,
    options: { trackListingTypeCompatMetrics?: boolean } = {}
) => {
    const allowLegacyListingTypeNullCompat = await isEnabled(FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);
    const query: Record<string, unknown> = { isDeleted: { $ne: true } };
    
    if (filters.sellerId && mongoose.Types.ObjectId.isValid(String(filters.sellerId))) {
        query.sellerId = new mongoose.Types.ObjectId(String(filters.sellerId));
    }

    if (filters.listingType) {
        const listingTypeFilterResult = buildListingTypeFilter(filters.listingType, allowLegacyListingTypeNullCompat);
        if (listingTypeFilterResult !== undefined) {
            query.listingType = listingTypeFilterResult.filter;
            if (listingTypeFilterResult.compatibilityApplied && options.trackListingTypeCompatMetrics) {
                setImmediate(() => {
                    void recordListingTypeCompatMetric('getAdCounts', filters.listingType);
                });
            }
        }
    }

    const [live, pending, sold, rejected, expired, deactivated, total] = await Promise.all([
        Ad.countDocuments({ ...query, status: AD_STATUS.LIVE }),
        Ad.countDocuments({ ...query, status: AD_STATUS.PENDING }),
        Ad.countDocuments({ ...query, status: AD_STATUS.SOLD }),
        Ad.countDocuments({ ...query, status: AD_STATUS.REJECTED }),
        Ad.countDocuments({ ...query, status: AD_STATUS.EXPIRED }),
        Ad.countDocuments({ ...query, status: AD_STATUS.DEACTIVATED }),
        Ad.countDocuments(query)
    ]);

    return {
        live,
        pending,
        sold,
        rejected,
        expired,
        deactivated,
        total
    };
};

/**
 * Returns a full breakdown of moderation status counts per listing type.
 * Aggregates in one pass for performance.
 */
export const computeModerationSummaryByType = async () => {
    const results = await Ad.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
            $group: {
                _id: {
                    listingType: { $ifNull: ['$listingType', 'ad'] },
                    status: '$status'
                },
                count: { $sum: 1 }
            }
        }
    ]);

    const summary: Record<string, Record<string, number>> = {
        ad: { total: 0 },
        service: { total: 0 },
        spare_part: { total: 0 }
    };

    results.forEach(res => {
        const type = res._id.listingType;
        const status = res._id.status;
        if (!summary[type]) summary[type] = { total: 0 };
        summary[type][status] = res.count;
        summary[type].total += res.count;
    });

    return summary;
};
/**
 * Returns a breakdown of listing stats for a specific seller across all listing types.
 * Used for the 'My Listings' dashboard to show counts on status pills.
 */
export const getSellerListingStats = async (sellerId: string) => {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error('Invalid Seller ID');
    }

    const results = await Ad.aggregate([
        { 
            $match: { 
                sellerId: new mongoose.Types.ObjectId(sellerId),
                isDeleted: { $ne: true } 
            } 
        },
        {
            $group: {
                _id: {
                    listingType: { $ifNull: ['$listingType', 'ad'] },
                    status: '$status'
                },
                count: { $sum: 1 }
            }
        }
    ]);

    const stats: Record<string, Record<string, number>> = {
        ad: { total: 0 },
        service: { total: 0 },
        spare_part: { total: 0 }
    };

    results.forEach(res => {
        const type = res._id.listingType as string;
        // Normalize status using the legacy-aware logic
        const status = normalizeAdStatus(res._id.status);
        
        if (!stats[type]) stats[type] = { total: 0 };
        stats[type][status] = (stats[type][status] || 0) + res.count;
        stats[type].total += res.count;
    });

    return stats;
};

// ─────────────────────────────────────────────────
// PUBLIC AD RETRIEVAL (No auth required)
// ─────────────────────────────────────────────────






export const getListingDetailById = async (adId: string) => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        return null;
    }

    const objectId = new mongoose.Types.ObjectId(adId);
    const ad = await Ad.findById(objectId)
        .populate('sellerId', 'name avatar trustScore')
        .populate({ path: 'categoryId', select: 'name slug', model: Category })
        .populate({ path: 'brandId', select: 'name slug', model: Brand })
        .populate({ path: 'modelId', select: 'name slug', model: ProductModel })
        .lean();

    return ad as Record<string, unknown> | null;
};

export const getReportedAdsAggregation = async (filters: { status?: string, reason?: string, search?: string }, pagination: { skip: number, limit: number }) => {
    const { status, reason, search } = filters;
    const { skip, limit } = pagination;

    const matchQuery: Record<string, unknown> = {};
    if (status && status !== 'all') matchQuery.status = status;
    if (reason && reason !== 'all') matchQuery.reason = reason;

    const pipeline: mongoose.PipelineStage[] = [
        { $match: matchQuery },
        {
            $group: {
                _id: '$adId',
                reportCount: { $sum: 1 },
                reports: { $push: '$$ROOT' },
                latestReportAt: { $max: '$createdAt' }
            }
        },
        {
            $lookup: {
                from: 'ads',
                localField: '_id',
                foreignField: '_id',
                as: 'adDetails'
            }
        },
        { $unwind: '$adDetails' },
        {
            $lookup: {
                from: 'users',
                localField: 'adDetails.sellerId',
                foreignField: '_id',
                as: 'sellerDetails'
            }
        },
        { $unwind: { path: '$sellerDetails', preserveNullAndEmptyArrays: true } },
        ...(search ? [{
            $match: {
                $or: [
                    { 'adDetails.title': { $regex: String(search), $options: 'i' } },
                    { 'reports.description': { $regex: String(search), $options: 'i' } }
                ]
            }
        }] : []),
        {
            $addFields: {
                isAutoHidden: { $eq: ['$adDetails.moderationStatus', AD_STATUS.REJECTED] }
            }
        },
        {
            $sort: {
                isAutoHidden: -1,
                reportCount: -1,
                latestReportAt: -1
            }
        }
    ];

    const [results, totalResults] = await Promise.all([
        Report.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
        Report.aggregate([...pipeline, { $count: 'count' }])
    ]);

    const total = totalResults[0]?.count || 0;

    const transformedData = results.map(group => {
        const latestReport = group.reports[group.reports.length - 1];
        return {
            id: group._id.toString(),
            reportId: latestReport._id.toString(),
            reason: latestReport.reason,
            status: latestReport.status,
            ad: group.adDetails,
            reportedAt: latestReport.createdAt,
            reporter: group.reports.map((r: any) => r.reportedBy),
            reportCount: group.reportCount,
            isAutoHidden: group.isAutoHidden
        };
    });

    return { data: transformedData, total };
};

// ─────────────────────────────────────────────────
// AD SUGGESTIONS (Autocomplete)
// ─────────────────────────────────────────────────

/**
 * Returns lightweight ad title suggestions for search autocomplete.
 * Moved from adQueryController to service layer.
 */
export const getAdSuggestions = async (q: string, limit = 10): Promise<string[]> => {
    if (!q || q.length < 2) return [];
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const docs = await Ad.find(
        { title: regex, status: AD_STATUS.LIVE, isDeleted: { $ne: true } },
        { title: 1 }
    ).limit(limit).lean();
    return Array.from(new Set(docs.map((d) => d.title as string).filter(Boolean)));
};

// ─────────────────────────────────────────────────
// AD QUEUE (Admin Moderation)
// ─────────────────────────────────────────────────

/**
 * Returns paginated ads filtered by a specific status.
 * Used for Admin moderation queues (e.g., pending review queue).
 */
export const getAdsByStatus = async (
    status: string,
    pagination: PaginationOptions
): Promise<{ data: Record<string, unknown>[]; total: number }> => {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        Ad.find({ status, isDeleted: { $ne: true } })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Ad.countDocuments({ status, isDeleted: { $ne: true } })
    ]);
    return { data: data as unknown as Record<string, unknown>[], total };
};

// ─────────────────────────────────────────────────
// AD LOOKUP BY SLUG (Public)
// ─────────────────────────────────────────────────

/**
 * Returns the MongoDB _id for an ad matched by its seoSlug with optional visibility filter.
 * Moved from adQueryController to service layer.
 */
export const getAdIdBySlug = async (
    slug: string,
    visibilityFilter: Record<string, unknown> = {}
): Promise<string | null> => {
    // 1. Direct match (canonical behavior)
    const slugQuery: Record<string, unknown> = { seoSlug: slug, ...visibilityFilter };
    const found = await Ad.findOne(slugQuery).select('_id').lean();
    if (found) return (found._id as mongoose.Types.ObjectId).toString();

    // 2. Fallback: Check if the slug is in 'name-slug-ID' format (common in frontend routing)
    // Extract the last 24 hex characters at the end of a hyphenated string.
    const match = slug.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (match && match[2]) {
        const potentialId = match[2];
        const foundById = await Ad.findOne({ _id: potentialId, ...visibilityFilter })
            .select('_id')
            .lean();
        if (foundById) return (foundById._id as mongoose.Types.ObjectId).toString();
    }

    return null;
};

/**
 * Builds the aggregation pipeline for the homepage feed.
 * Pushes heavy lifting (facet matching, sorting, spotlight/boost separation) to MongoDB.
 */
export const buildHomeFeedPipeline = (
    matchStage: UnknownRecord,
    boostedIds: mongoose.Types.ObjectId[],
    limit: number,
    geoStage?: mongoose.PipelineStage,
    cursor?: { createdAt: Date; id?: string | null }
): mongoose.PipelineStage[] => {
    const pipeline: mongoose.PipelineStage[] = [];
    const now = new Date();
    const effectiveSpotlightMatch: UnknownRecord = {
        isSpotlight: true,
        spotlightExpiresAt: { $gt: now }
    };
    const nonSpotlightFallbackMatch: UnknownRecord = {
        $or: [
            { isSpotlight: { $ne: true } },
            { spotlightExpiresAt: { $exists: false } },
            { spotlightExpiresAt: null },
            { spotlightExpiresAt: { $lte: now } }
        ]
    };

    if (geoStage) {
        pipeline.push(geoStage);
    }
    
    // SSOT Pipeline Protection
    const visibilityMatch = { ...(matchStage || {}), ...buildPublicAdFilter() };
    pipeline.push({ $match: visibilityMatch as any });

    if (cursor?.id && mongoose.Types.ObjectId.isValid(cursor.id)) {
        pipeline.push({
            $match: {
                $or: [
                    { createdAt: { $lt: cursor.createdAt } },
                    {
                        createdAt: cursor.createdAt,
                        _id: { $lt: new mongoose.Types.ObjectId(cursor.id) }
                    }
                ]
            }
        });
    } else if (cursor) {
        pipeline.push({
            $match: {
                createdAt: { $lt: cursor.createdAt }
            }
        });
    }

    pipeline.push(
        { $sort: { createdAt: -1, _id: -1 } },
        {
            $facet: {
                spotlight: [
                    { $match: { ...visibilityMatch, ...effectiveSpotlightMatch } as any },
                    { $limit: limit * 2 }
                ],
                boosted: [
                    {
                        $match: {
                            _id: { $in: boostedIds },
                            ...visibilityMatch,
                            ...nonSpotlightFallbackMatch
                        } as any
                    },
                    { $limit: limit * 2 }
                ],
                organic: [
                    {
                        $match: {
                            _id: { $nin: boostedIds },
                            ...visibilityMatch,
                            ...nonSpotlightFallbackMatch
                        } as any
                    },
                    { $limit: limit * 2 }
                ]
            }
        }
    );

    return pipeline;
};
