import mongoose from 'mongoose';
import { env } from '../../config/env';
import Ad from '../../models/Ad';
import Boost from '../../models/Boost';
import { buildAdMatchStage } from '../ad/AdSearchService';
import { buildHomeFeedPipeline } from '../ad/AdFeedService';
import type { AdFilters } from '../ad/_shared/adFilterHelpers';
import { normalizeAdImagesForResponse } from '../adQuery/AdQueryHelpers';
import { buildGeoNearStage, normalizeGeoInput } from '../../utils/GeoUtils';
import type { HomeFeedResponse } from '../../../../shared/types/Api';
import logger from '../../utils/logger';
import { FeedDecisionEngine } from '../FeedDecisionEngine';
import { HomeFeedRequest, ParsedHomeFeedCursor } from './FeedCursorService';
import { 
    filterBeforeCursor, 
    mergeRankedFeed, 
    extractAdId, 
    extractObjectIdHex,
    FeedAdRecord 
} from './FeedRankerService';

interface FeedFacetResult {
    spotlight: Record<string, unknown>[];
    boosted: Record<string, unknown>[];
    organic: Record<string, unknown>[];
}

export const buildHomeFeed = async (
    input: HomeFeedRequest,
    limit: number,
    cursor: ParsedHomeFeedCursor | null
): Promise<HomeFeedResponse> => {
    const { LISTING_TYPE } = await import('../../../../shared/enums/listingType');

    const startedAt = Date.now();
    
    // 1. Resolve Match Criteria
    const baseFilters: AdFilters = {
        listingType: LISTING_TYPE.AD,
        sortBy: 'newest',
        ...(typeof input.location === 'string' && input.location.trim().length > 0
            ? { location: input.location.trim() }
            : {}),
        ...(typeof input.locationId === 'string' && mongoose.Types.ObjectId.isValid(input.locationId)
            ? { locationId: input.locationId }
            : {}),
        ...(typeof input.level === 'string'
            ? { level: input.level }
            : {}),
        ...(typeof input.categoryId === 'string' && input.categoryId.trim().length > 0
            ? { categoryId: input.categoryId.trim() }
            : {}),
        ...(typeof input.category === 'string' && input.category.trim().length > 0
            ? { category: input.category.trim() }
            : {})
    };

    const matchStage = await buildAdMatchStage(baseFilters);

    if (env.FEED_DEBUG) {
        logger.debug(`[FeedDebug] Final Match Filter`, { matchStage });
    }

    // 2. Fetch Active Boosts (Fast Indexed Query)
    const now = new Date();
    const boostCandidates = await Boost.find({
        entityType: 'ad',
        isActive: true,
        startsAt: { $lte: now },
        endsAt: { $gt: now }
    })
        .select('entityId')
        .sort({ createdAt: -1 })
        .limit(200) // Safety cap
        .lean<Array<{ entityId?: mongoose.Types.ObjectId }>>();

    const boostedIds = boostCandidates
        .map((entry) => entry.entityId)
        .filter((id): id is mongoose.Types.ObjectId => id instanceof mongoose.Types.ObjectId);

    // 2.5 Resolve Geo Location ($geoNear MUST be the first stage if coordinates are present)
    const { lat, lng, hasGeo } = normalizeGeoInput(input.lat, input.lng);
    const normalizedLevel = typeof input.level === 'string' ? input.level.toLowerCase() : undefined;
    const shouldUseGeo = hasGeo && normalizedLevel !== 'state' && normalizedLevel !== 'country';
    const safeRadius = shouldUseGeo 
        ? Math.min(Math.max(Number(input.radiusKm) || 50, 1), 500) 
        : 0;
    
    let geoStage: mongoose.PipelineStage | undefined = undefined;
    if (shouldUseGeo) {
        geoStage = buildGeoNearStage({
            lng,
            lat,
            radiusKm: safeRadius,
            query: matchStage
        });
        // Clear out matchStage so it doesn't run twice (geoStage incorporates it)
        Object.keys(matchStage).forEach(key => delete matchStage[key]);
    }

    // 3. Unified Aggregation
    const pipeline = buildHomeFeedPipeline(matchStage, boostedIds, limit, geoStage, cursor ?? undefined);
    const [facetResults] = await Ad.aggregate<FeedFacetResult>(pipeline);

    const spotlightAds = filterBeforeCursor(
        (facetResults?.spotlight ?? []).map((ad) => ({
            ...ad,
            isSpotlight: true,
            isBoosted: false
        })),
        cursor
    );
    const boostedAds = filterBeforeCursor(
        (facetResults?.boosted ?? []).map((ad) => ({
            ...ad,
            isSpotlight: false,
            isBoosted: true
        })),
        cursor
    );
    const organicAds = filterBeforeCursor(
        (facetResults?.organic ?? []).map((ad) => ({
            ...ad,
            isSpotlight: false,
            isBoosted: false
        })),
        cursor
    );

    // 4. Merge results
    const merged = mergeRankedFeed(spotlightAds, boostedAds, organicAds, limit);

    // 5. Fallback Logic
    let isFallbackResult = false;
    const isStrictLocation = Boolean(input.locationId || input.location || shouldUseGeo);

    if (!cursor && merged.ads.length < 4 && isStrictLocation) {
        isFallbackResult = true;
        const seenIds = new Set(merged.ads.map(extractAdId).filter(Boolean));

        const engineResult = await FeedDecisionEngine.getFallbackFeed(
            {
                locationId: input.locationId,
                city: typeof input.location === 'string' ? input.location.trim() : undefined,
                state: input.level === 'state' && typeof input.location === 'string' ? input.location.trim() : undefined,
                lat: shouldUseGeo ? input.lat : undefined,
                lng: shouldUseGeo ? input.lng : undefined,
            },
            Array.from(seenIds),
            limit - merged.ads.length,
            input.categoryId
        );

        const sortedBucket = engineResult.ads;
        for (const ad of sortedBucket) {
            if (merged.ads.length >= limit) break;
            const id = extractAdId(ad);
            if (!id || seenIds.has(id)) continue;
            seenIds.add(id);
            merged.ads.push(ad as FeedAdRecord);
        }
    }

    const lastAd = merged.ads[merged.ads.length - 1];
    const lastAdCursor = lastAd
        ? {
            createdAt: new Date(String(lastAd.createdAt ?? '')).toISOString(),
            id: extractObjectIdHex(lastAd) || String(extractAdId(lastAd))
        }
        : null;

    logger.debug('Home feed build timings', { 
        durationMs: Date.now() - startedAt,
        adsCount: merged.ads.length,
        isFallback: isFallbackResult
    });

    return {
        ads: merged.ads.map(ad => normalizeAdImagesForResponse(ad as Record<string, unknown>)) as HomeFeedResponse['ads'],
        nextCursor: merged.hasRemaining ? lastAdCursor : null,
        hasMore: merged.hasRemaining && merged.ads.length > 0,
        isFallback: isFallbackResult
    };
};
