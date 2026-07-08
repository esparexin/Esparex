import mongoose from 'mongoose';
import Ad from '../../models/Ad';
import { serializeDoc, normalizeLocationResponse, buildGeoNearStage, normalizeGeoInput, getMultiCache, setMultiCache, CACHE_KEYS, buildPublicAdFilter, logger, RankingTelemetry, uuidv4, extractLocationIdFromAd, normalizeAdImagesForResponse, FeatureFlag, isEnabled, getBlockedSellerIds, touchLocationSearchAnalytics } from '../ad/_shared/adServiceBase';
import type { AdsListResult, AdFilters, UnknownRecord, AggregationStage, PaginationOptions, PublicQueryOptions, SortStage } from '../ad/_shared/adServiceBase';
import { buildAdMatchStage, buildAdSortStage } from '../ad/AdSearchService';
import type { HydratedAd, TelemetryAd } from './types';
import { hydrateAdMetadata } from './metadata';
import { getListingSuggestions } from './telemetry';

const MAX_PAGE_SIZE = 50;
const MAX_PAGE = 1000;
const MAX_RADIUS_KM = 500;

export const getAds = async (
    filters: AdFilters,
    pagination: PaginationOptions,
    options: PublicQueryOptions = {}
): Promise<AdsListResult> => {
    const { page: rawPage, limit: rawLimit, cursor } = pagination;
    const limit = Math.min(Math.max(Number(rawLimit) || 20, 1), MAX_PAGE_SIZE);
    const page = Math.min(Math.max(Number(rawPage) || 1, 1), MAX_PAGE);
    const cursorId = typeof cursor === 'string' && mongoose.Types.ObjectId.isValid(cursor) ? new mongoose.Types.ObjectId(cursor) : null;
    const isCursorMode = Boolean(cursorId);
    const isTrendingSort = filters.sortBy === 'trending';
    const skip = (page - 1) * limit;
    const shouldApplyLocationIntelligence = !options.disableLocationIntelligence && !isCursorMode;
    const { lat, lng, hasGeo } = normalizeGeoInput(
        filters.coordinates ? filters.coordinates.coordinates[1] : filters.lat,
        filters.coordinates ? filters.coordinates.coordinates[0] : filters.lng
    );
    const normalizedLevel = typeof filters.level === 'string' ? filters.level.toLowerCase() : undefined;
    const isRegionLevel = normalizedLevel === 'country' || normalizedLevel === 'state';
    const shouldUseGeo = hasGeo && !isRegionLevel;
    const shouldSkipExactCount = shouldUseGeo && !isCursorMode && options.enforcePublicVisibility !== false;
    const shouldUseRankScore = isTrendingSort || (shouldUseGeo && !filters.sortBy);
    const safeRadius = shouldUseGeo ? Math.min(Math.max(Number(filters.radiusKm) || 50, 1), MAX_RADIUS_KM) : 0;
    const effectiveFilters: AdFilters = { ...filters };
    const locationLabel = typeof filters.location === 'string' ? filters.location.trim() : '';
    if (normalizedLevel === 'state' && !effectiveFilters.state && locationLabel.length > 0) effectiveFilters.state = locationLabel;
    if (normalizedLevel === 'country' && !effectiveFilters.country && locationLabel.length > 0) effectiveFilters.country = locationLabel;
    if (!shouldUseGeo) { delete effectiveFilters.lat; delete effectiveFilters.lng; delete effectiveFilters.radiusKm; delete effectiveFilters.coordinates; }
    const allowLegacyListingTypeNullCompat = await isEnabled(FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);
    const pipeline: AggregationStage[] = [];
    let match: UnknownRecord = { ...(await buildAdMatchStage(effectiveFilters, { allowLegacyListingTypeNullCompat, trackListingTypeCompatMetrics: options.trackListingTypeCompatMetrics, metricContext: 'getAds' })) };
    if (options.enforcePublicVisibility) {
        logger.info('[FeedVisibility] Applying public visibility guard', { viewerId: options.viewerId ?? null });
        match = { ...match, ...buildPublicAdFilter() };
    }
    const blockedSellerIds = await getBlockedSellerIds(options.viewerId);
    if (blockedSellerIds.length > 0) {
        logger.info('[FeedVisibility] Applying blocked-seller guard', { viewerId: options.viewerId, blockedSellerCount: blockedSellerIds.length });
        const blockedFilter = { sellerId: { $nin: blockedSellerIds } };
        match = Object.keys(match).length > 0 ? { $and: [match, blockedFilter] } : blockedFilter;
    }
    const textSearch = typeof filters.search === 'string' && filters.search.trim().length > 0 ? filters.search.trim() : undefined;
    if (cursorId) {
        const cursorMatch = { _id: { $lt: cursorId } };
        match = Object.keys(match).length > 0 ? { $and: [match, cursorMatch] } : cursorMatch;
    }
    if (shouldUseGeo) {
        if (textSearch) match.$text = { $search: textSearch };
        delete match['location.city']; delete match['location.state']; delete match['location.country']; delete match['location.display']; delete match['location.district'];
        if (Array.isArray(match.$or)) {
            const currentOr = match.$or as UnknownRecord[];
            const filteredOr = currentOr.filter((cond) => !Object.keys(cond).some(k => k.startsWith('location.')));
            if (filteredOr.length === 0) delete match.$or; else match.$or = filteredOr;
        }
        pipeline.push(buildGeoNearStage({ lng, lat, radiusKm: safeRadius, query: match }));
    } else {
        if (textSearch) match.$text = { $search: textSearch };
        pipeline.push({ $match: match });
    }
    const countPipeline: AggregationStage[] = isCursorMode ? [] : [...pipeline];
    if (shouldUseRankScore) pipeline.push({ $sort: { isSpotlight: -1, createdAt: -1 } as SortStage });
    const sort = buildAdSortStage({ ...effectiveFilters, search: shouldUseGeo ? undefined : effectiveFilters.search });
    if (!shouldUseRankScore) pipeline.push({ $sort: sort });
    if (!isCursorMode && !shouldSkipExactCount) { countPipeline.push({ $count: 'total' }); pipeline.push({ $skip: skip }); pipeline.push({ $limit: limit }); }
    else { pipeline.push({ $skip: skip }); pipeline.push({ $limit: limit + 1 }); }
    if (shouldUseRankScore) {
        pipeline.push({
            $lookup: { from: 'locationanalytics', let: { locationRef: '$location.locationId' }, pipeline: [{ $match: { $expr: { $eq: ['$locationId', '$$locationRef'] } } }, { $project: { popularityScore: 1, isHotZone: 1 } }, { $limit: 1 }], as: 'locationAnalytics' }
        });
        pipeline.push({
            $addFields: {
                locationAnalytics: { $arrayElemAt: ['$locationAnalytics', 0] },
                hoursSince: { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60] },
                freshnessScore: { $max: [0, { $subtract: [100, { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60] }] }] },
                distanceScore: { $cond: [{ $ifNull: ['$distance', false] }, { $max: [0, { $subtract: [100, { $multiply: [{ $divide: ['$distance', 1000] }, 2] }] }] }, 0] },
                popularityScore: { $min: [{ $ifNull: ['$locationAnalytics.popularityScore', 0] }, 100] },
                spotlightScore: { $cond: [{ $and: [{ $eq: ['$isSpotlight', true] }, { $gt: ['$spotlightExpiresAt', new Date()] }] }, 100, 0] },
                engagementScore: { $min: [{ $divide: [{ $ifNull: ['$views.total', 0] }, 10] }, 100] },
                hotZoneBoost: { $cond: [{ $eq: ['$locationAnalytics.isHotZone', true] }, 10, 0] }
            }
        });
        pipeline.push({ $addFields: { rankScore: { $add: [{ $multiply: ['$distanceScore', 0.4] }, { $multiply: ['$freshnessScore', 0.25] }, { $multiply: ['$popularityScore', 0.15] }, { $multiply: ['$spotlightScore', 0.1] }, { $multiply: ['$engagementScore', 0.1] }, '$hotZoneBoost', { $multiply: [{ $ifNull: ['$sellerTrustSnapshot', 50] }, 0.05] }, { $multiply: [{ $ifNull: ['$listingQualityScore', 0] }, 0.08] }, { $multiply: [{ $ifNull: ['$fraudScore', 0] }, -1] }] } } });
        pipeline.push({ $sort: { rankScore: -1, createdAt: -1 } });
    }
    const isLightweightListing = await isEnabled(FeatureFlag.ENABLE_LIGHTWEIGHT_LISTING);
    const shouldJoinSeller = !isLightweightListing || !options.enforcePublicVisibility;
    if (shouldJoinSeller) {
        pipeline.push({ $lookup: { from: 'users', let: { refId: '$sellerId' }, pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$refId'] } } }, { $project: { name: 1, firstName: 1, lastName: 1, phone: 1, mobile: 1, email: 1 } }], as: 'seller' } });
        pipeline.push({ $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } });
    }
    pipeline.push({
        $project: {
            title: 1, price: 1, priceMin: 1, priceMax: 1, diagnosticFee: 1, images: 1, description: 1,
            location: 1, status: 1, createdAt: 1, updatedAt: 1, views: 1, categoryId: 1, brandId: 1, modelId: 1,
            sellerId: 1, listingType: 1, planType: 1, isSpotlight: 1, spotlightExpiresAt: 1, expiresAt: 1,
            publishedAt: 1, approvedAt: 1, soldAt: 1, rejectionReason: 1, fraudScore: 1, moderationStatus: 1,
            distance: 1, distanceKm: { $cond: [{ $ifNull: ['$distance', false] }, { $divide: ['$distance', 1000] }, null] },
            rankScore: 1, distanceScore: 1, freshnessScore: 1, popularityScore: 1, sellerTrustSnapshot: 1,
            listingQualityScore: 1, onsiteService: 1, turnaroundTime: 1, warranty: 1, included: 1, excluded: 1,
            serviceTypeIds: 1, sparePartId: 1, condition: 1, stock: 1, deviceType: 1, deviceCondition: 1,
            sparePartsSnapshot: 1, sparePartIds: 1, category: 1, brand: 1, model: 1, seller: 1, spareParts: 1
        }
    });
    const [rawResults, countResult] = await Promise.all([
        Ad.aggregate<HydratedAd>(pipeline),
        isCursorMode || shouldSkipExactCount ? Promise.resolve([]) : Ad.aggregate<{ total: number }>(countPipeline),
    ]);
    const useCursorStyleMeta = isCursorMode || shouldSkipExactCount;
    const hasMore = useCursorStyleMeta ? rawResults.length > limit : false;
    const results = useCursorStyleMeta ? rawResults.slice(0, limit) : rawResults;
    const shouldHydrateMetadata = !isLightweightListing || !options.enforcePublicVisibility;
    if (shouldHydrateMetadata) await hydrateAdMetadata(results);
    const nextCursor = useCursorStyleMeta && hasMore && results.length > 0 ? String(results[results.length - 1]?._id || '') : undefined;
    const total = useCursorStyleMeta ? results.length : countResult[0]?.total || 0;
    const data = results.map(ad => {
        const serializedAd = serializeDoc(ad);
        if (serializedAd.location) serializedAd.location = normalizeLocationResponse(serializedAd.location);
        return normalizeAdImagesForResponse(serializedAd as unknown as Record<string, unknown>);
    });
    const hasLocationContext = Boolean(hasGeo || effectiveFilters.locationId || effectiveFilters.location || effectiveFilters.district || effectiveFilters.state || effectiveFilters.country || effectiveFilters.level);
    if (hasLocationContext && !options.disableLocationIntelligence) {
        const trackedLocationIds = Array.from(new Set([typeof effectiveFilters.locationId === 'string' ? effectiveFilters.locationId : null, ...data.map((ad) => extractLocationIdFromAd(ad))].filter((v): v is string => Boolean(v))));
        if (trackedLocationIds.length > 0) {
            setImmediate(() => { touchLocationSearchAnalytics(trackedLocationIds).catch((error) => { logger.warn('Failed to update location_search analytics', { locationIds: trackedLocationIds, error: error instanceof Error ? error.message : String(error) }); }); });
        }
    }
    if (shouldApplyLocationIntelligence && shouldUseGeo && !isCursorMode && !filters.radiusKm) {
        // L1-L4 fallback logic inlined below
        const mergedById = new Map<string, Record<string, unknown>>();
        let locationHierarchyLevel: 'L1' | 'L2' | 'L3' | 'L4' = 'L1';
        const mergeAds = (items: Array<Record<string, unknown>>) => { for (const item of items) { const key = String(item.id || item._id || ''); if (!key || mergedById.has(key)) continue; mergedById.set(key, item); } };
        mergeAds(data);
        const minimumTarget = Math.min(limit, 10);
        const fetchMore = async (nextFilters: AdFilters) => { const remaining = Math.max(limit - mergedById.size, 1); if (remaining <= 0) return; const response = await getAds({ ...nextFilters, excludeIds: Array.from(mergedById.keys()) }, { page: 1, limit: remaining }, { ...options, disableLocationIntelligence: true }); mergeAds(response.data); };
        if (mergedById.size < minimumTarget && effectiveFilters.locationId) { locationHierarchyLevel = 'L2'; await fetchMore({ status: filters.status, locationId: effectiveFilters.locationId, categoryId: effectiveFilters.categoryId, sortBy: 'newest' }); }
        if (mergedById.size < minimumTarget && effectiveFilters.state) { locationHierarchyLevel = 'L3'; await fetchMore({ status: filters.status, state: effectiveFilters.state, categoryId: effectiveFilters.categoryId, sortBy: 'newest' }); }
        if (mergedById.size < minimumTarget) { locationHierarchyLevel = 'L4'; await fetchMore({ status: filters.status, categoryId: effectiveFilters.categoryId, sortBy: 'newest' }); }
        const merged = Array.from(mergedById.values());
        merged.sort((left, right) => {
            const leftScore = Number((left as { rankScore?: unknown }).rankScore ?? 0);
            const rightScore = Number((right as { rankScore?: unknown }).rankScore ?? 0);
            if (shouldUseRankScore && rightScore !== leftScore) return rightScore - leftScore;
            if (filters.sortBy === 'price-low') return Number((left as { price?: unknown }).price || 0) - Number((right as { price?: unknown }).price || 0);
            if (filters.sortBy === 'price-high') return Number((right as { price?: unknown }).price || 0) - Number((left as { price?: unknown }).price || 0);
            return new Date(String((right as { createdAt?: unknown }).createdAt || 0)).getTime() - new Date(String((left as { createdAt?: unknown }).createdAt || 0)).getTime();
        });
        const limited = merged.slice(0, limit);
        logger.info('[AdAggregationService] Location intelligence fallback applied', { locationHierarchyLevel, totalFound: merged.length, targetSize: limit, minimumTarget, searchState: effectiveFilters.state, searchLocationId: effectiveFilters.locationId, effectiveRadiusKm: safeRadius });
        return { data: limited, meta: { effectiveRadiusKm: safeRadius, locationHierarchyLevel }, pagination: { page, limit, hasMore: merged.length > limit, nextCursor: merged.length > limit ? String((limited[limited.length - 1] as { id?: unknown; _id?: unknown })?.id || (limited[limited.length - 1] as { id?: unknown; _id?: unknown })?._id || '') : undefined, cursor: cursor || null } };
    }
    return {
        data,
        meta: { effectiveRadiusKm: shouldUseGeo ? safeRadius : undefined },
        pagination: {
            page, limit,
            ...(useCursorStyleMeta ? { hasMore, nextCursor, cursor: cursor || null } : { total, hasMore: total > page * limit, totalPages: Math.ceil(total / limit) }),
        }
    };
};

// Ranking telemetry — sampled 5%
export async function recordRankingTelemetry(data: Record<string, unknown>[]) {
    if (Math.random() < 0.05 && data && data.length > 0) {
        setImmediate(() => {
            try {
                const eventId = uuidv4();
                const docs = (data as TelemetryAd[]).slice(0, 10).map((ad, index) => ({
                    eventId, adId: ad.id || ad._id, position: index + 1, rankScore: ad.rankScore || 0,
                    components: { qualityScore: ad.listingQualityScore || 0, distanceScore: ad.distanceScore || 0, freshnessScore: ad.freshnessScore || 0, popularityScore: ad.popularityScore || 0, sellerTrust: ad.sellerTrustSnapshot || 50 }
                }));
                RankingTelemetry.insertMany(docs).catch((err: Error) => logger.warn('Failed to insert ranking telemetry', { error: err.message }));
            } catch (error) { logger.warn('Ranking telemetry error', { error: error instanceof Error ? error.message : String(error) }); }
        });
    }
}
