import mongoose from 'mongoose';
import { env } from '../../config/env';
import Boost from '../../models/Boost';
import Category from '../../models/Category';
import { getListingRepository } from '../../composition/listings';
import type { ListingFilter, Listing } from '../../domains/listings/ports/ListingRepositoryPort';
import { buildPublicAdFilter } from '../../utils/FeedVisibilityGuard';
import { normalizeAdImagesForResponse } from '../adQuery/AdQueryHelpers';
import { normalizeGeoInput } from '../../utils/mongoGeoUtils';
import type { HomeFeedResponse } from "@esparex/shared";
import logger from '../../utils/logger';
import { FeedDecisionEngine } from '../FeedDecisionEngine';
import { HomeFeedRequest, ParsedHomeFeedCursor } from './FeedCursorService';
import { LISTING_TYPE } from '@esparex/contracts';
import { 
    filterBeforeCursor, 
    mergeRankedFeed, 
    extractAdId, 
    extractObjectIdHex 
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
    const startedAt = Date.now();
    
    // 1. Resolve Match Criteria
    const baseFilter: ListingFilter = {
        listingType: LISTING_TYPE.AD,
    };

    if (typeof input.locationId === 'string' && mongoose.Types.ObjectId.isValid(input.locationId)) {
        baseFilter.locationId = input.locationId;
    } else if (typeof input.location === 'string' && input.location.trim().length > 0) {
        const safeLoc = input.location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (input.level === 'state') {
            baseFilter.locationState = { $regex: `^${safeLoc}$`, $options: 'i' };
        } else if (input.level === 'city' || !input.level) {
            baseFilter.locationCity = { $regex: `^${safeLoc}$`, $options: 'i' };
        }
    }

    let resolvedCategoryId: string | undefined = undefined;
    if (typeof input.categoryId === 'string' && input.categoryId.trim().length > 0) {
        resolvedCategoryId = input.categoryId.trim();
    } else if (typeof input.category === 'string' && input.category.trim().length > 0) {
        const lookup = input.category.trim();
        const found = await Category.findOne({
            $or: [
                { slug: lookup.toLowerCase() },
                { name: { $regex: `^${lookup.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }
            ]
        }).select('_id').lean<{ _id: mongoose.Types.ObjectId } | null>();
        if (found) {
            resolvedCategoryId = found._id.toString();
        }
    }

    if (resolvedCategoryId) {
        baseFilter.categoryId = resolvedCategoryId;
    }

    const visibilityFilter = buildPublicAdFilter() as unknown as Partial<ListingFilter>;
    Object.assign(baseFilter, visibilityFilter);

    if (cursor) {
        baseFilter.cursorCreatedAt = cursor.createdAt;
        if (cursor.id) baseFilter.cursorId = cursor.id;
    }

    if (env.FEED_DEBUG) {
        logger.debug(`[FeedDebug] Final Match Filter`, { baseFilter });
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

    const { lat, lng, hasGeo } = normalizeGeoInput(input.lat, input.lng);
    const normalizedLevel = typeof input.level === 'string' ? input.level.toLowerCase() : undefined;
    const shouldUseGeo = hasGeo && normalizedLevel !== 'state' && normalizedLevel !== 'country';
    const safeRadius = shouldUseGeo 
        ? Math.min(Math.max(Number(input.radiusKm) || 50, 1), 500) 
        : 0;
    
    // 3. Unified Fetch via ListingRepositoryPort
    const spotlightFilter: ListingFilter = {
        ...baseFilter,
        isSpotlight: true,
        spotlightExpiresAt: { $gt: now }
    };
    
    const nonSpotlightFilter: ListingFilter = {
        ...baseFilter,
        $or: [
            { isSpotlight: { $ne: true } },
            { spotlightExpiresAt: { $exists: false } },
            { spotlightExpiresAt: null },
            { spotlightExpiresAt: { $lte: now } }
        ]
    };

    const boostedFilter: ListingFilter = {
        ...nonSpotlightFilter,
        ids: boostedIds.map(String)
    };

    const organicFilter: ListingFilter = {
        ...nonSpotlightFilter,
        idsNotIn: boostedIds.map(String)
    };

    const sortOption: Record<string, 1 | -1> = { createdAt: -1, _id: -1 };
    
    const fetch = async (filter: ListingFilter): Promise<readonly Listing[]> => {
        if (shouldUseGeo && lat !== undefined && lng !== undefined) {
            return getListingRepository().findWithinRadius(lng, lat, safeRadius, filter, sortOption, limit * 2);
        }
        return getListingRepository().findWithLimit(filter, sortOption, limit * 2);
    };

    const [spotlightListings, boostedListings, organicListings] = await Promise.all([
        fetch(spotlightFilter),
        fetch(boostedFilter),
        fetch(organicFilter)
    ]);

    const toFeedAd = (l: Listing, overrides: { isSpotlight: boolean, isBoosted: boolean }) => ({
        ...l,
        _id: l.id,
        ...overrides
    });

    const spotlightAds = filterBeforeCursor(
        spotlightListings.map(l => toFeedAd(l, { isSpotlight: true, isBoosted: false })),
        cursor
    );
    const boostedAds = filterBeforeCursor(
        boostedListings.map(l => toFeedAd(l, { isSpotlight: false, isBoosted: true })),
        cursor
    );
    const organicAds = filterBeforeCursor(
        organicListings.map(l => toFeedAd(l, { isSpotlight: false, isBoosted: false })),
        cursor
    );

    // 4. Merge results
    const merged = mergeRankedFeed(spotlightAds as Record<string, unknown>[], boostedAds as Record<string, unknown>[], organicAds as Record<string, unknown>[], limit);

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
            merged.ads.push(ad);
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
