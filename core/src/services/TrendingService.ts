import mongoose from 'mongoose';
import { getListingRepository } from '../composition/listings';
import type { ListingFilter } from '../domains/listings/ports/ListingRepositoryPort';
import AdAnalytics from '../models/AdAnalytics';
import Category from '../models/Category';
import { getCache, setCache } from '../utils/redisCache';
import { LISTING_STATUS } from '@esparex/contracts';
import logger from '../utils/logger';
import { normalizeAdImagesForResponse } from '../domains/listings/application/queries/adQuery/AdQueryHelpers';
import { toObjectId } from '../utils/idUtils';
import { LISTING_TYPE } from '@esparex/contracts';

type AnalyticsEventType = 'view' | 'favorite';

type TrendingInput = {
    location?: string;
    locationId?: string;
    category?: string;
    categoryId?: string;
    limit?: number;
};

type TrendingCounterState = {
    views: number;
    favorites: number;
};

type AnalyticsSnapshot = TrendingCounterState & {
    _id?: unknown;
    adId: mongoose.Types.ObjectId;
    score?: number;
    updatedAt?: Date;
};

const TRENDING_LIMIT_DEFAULT = 20;
const TRENDING_LIMIT_MAX = 20;
const TRENDING_CACHE_TTL_SECONDS = 120;

const SCORE_WEIGHTS = {
    views: 2,
    favorites: 3,
} as const;

const RECENCY_WINDOW_HOURS = 48;
const RECENCY_MAX_BONUS = 12;

const normalizeSegment = (value: unknown, fallback: string): string => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, '-');
    return normalized.length > 0 ? normalized : fallback;
};

const resolveTrendingCacheKey = (input: TrendingInput): string => {
    const locationSegment = normalizeSegment(input.locationId || input.location, 'global');
    const categorySegment = normalizeSegment(input.categoryId || input.category, 'all');
    return `trending:${locationSegment}:${categorySegment}`;
};



const toFiniteNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getRecencyBonus = (createdAt: Date | null): number => {
    if (!createdAt) return 0;
    const ageMs = Date.now() - createdAt.getTime();
    if (!Number.isFinite(ageMs) || ageMs <= 0) return RECENCY_MAX_BONUS;
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours >= RECENCY_WINDOW_HOURS) return 0;
    const ratio = Math.max(0, (RECENCY_WINDOW_HOURS - ageHours) / RECENCY_WINDOW_HOURS);
    return Number((RECENCY_MAX_BONUS * ratio).toFixed(4));
};

export const calculateTrendingScore = (
    counters: TrendingCounterState,
    createdAt: Date | null
): number => {
    const baseScore = (
        counters.views * SCORE_WEIGHTS.views +
        counters.favorites * SCORE_WEIGHTS.favorites
    );
    return Number((baseScore + getRecencyBonus(createdAt)).toFixed(4));
};

const resolveCategoryId = async (category?: string, categoryId?: string): Promise<mongoose.Types.ObjectId | null> => {
    const directCategoryId = toObjectId(categoryId || category);
    if (directCategoryId) return directCategoryId;
    if (!category || category.trim().length === 0) return null;

    const lookup = category.trim();
    const found = await Category.findOne({
        $or: [
            { slug: lookup.toLowerCase() },
            { name: { $regex: `^${lookup.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }
        ]
    })
        .select('_id')
        .lean<{ _id: mongoose.Types.ObjectId } | null>();

    return found?._id || null;
};


const buildDirectAdFilter = async (input: TrendingInput): Promise<ListingFilter> => {
    const filter: ListingFilter = {
        status: LISTING_STATUS.LIVE,
        isDeleted: { $ne: true },
        listingType: LISTING_TYPE.AD,
    };

    const locationObjectId = toObjectId(input.locationId);
    if (locationObjectId) {
        filter.locationId = locationObjectId.toString();
    } else if (typeof input.location === 'string' && input.location.trim().length > 0) {
        const safeLocation = input.location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.locationCity = { $regex: `^${safeLocation}$`, $options: 'i' };
    }

    const resolvedCategoryId = await resolveCategoryId(input.category, input.categoryId);
    if (resolvedCategoryId) {
        filter.categoryId = resolvedCategoryId.toString();
    }

    return filter;
};

export const recordAdAnalyticsEvent = async (
    adId: string | mongoose.Types.ObjectId,
    eventType: AnalyticsEventType
): Promise<void> => {
    const objectId = toObjectId(adId);
    if (!objectId) return;

    const incrementPath =
        eventType === 'view'
            ? 'views'
            : 'favorites';

    try {
        const ad = await getListingRepository().findById(objectId.toString());
        if (!ad || ad.isDeleted || ad.status !== LISTING_STATUS.LIVE) return;

        const snapshot = await AdAnalytics.findOneAndUpdate(
            { adId: objectId },
            {
                $inc: { [incrementPath]: 1 },
                $setOnInsert: {
                    adId: objectId,
                    views: 0,
                    favorites: 0,
                    score: 0,
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        ).lean<AnalyticsSnapshot | null>();

        if (!snapshot) return;

        const score = calculateTrendingScore(
            {
                views: toFiniteNumber(snapshot.views),
                favorites: toFiniteNumber(snapshot.favorites),
            },
            ad.createdAt || null
        );

        await AdAnalytics.updateOne(
            { adId: objectId },
            { $set: { score } }
        );
    } catch (error) {
        logger.warn('Failed to record ad analytics event', {
            adId: String(objectId),
            eventType,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const getTrendingAds = async (input: TrendingInput): Promise<{ ads: Record<string, unknown>[] }> => {
    const limit = Math.max(1, Math.min(TRENDING_LIMIT_MAX, Math.floor(Number(input.limit) || TRENDING_LIMIT_DEFAULT)));
    const cacheKey = resolveTrendingCacheKey(input);

    try {
        const cached = await getCache<{ ads: Record<string, unknown>[] }>(cacheKey);
        if (cached && Array.isArray(cached.ads)) {
            return cached;
        }

        let mergedAds: Record<string, unknown>[] = [];
        let skip = 0;
        const batchSize = Math.max(limit * 2, 20);

        while (mergedAds.length < limit && skip < 1000) {
            const analyticsBatch = await AdAnalytics.find()
                .sort({ score: -1, updatedAt: -1 })
                .skip(skip)
                .limit(batchSize)
                .lean<AnalyticsSnapshot[]>();

            if (analyticsBatch.length === 0) break;

            const adIds = analyticsBatch.map((a) => String(a.adId));
            const filter = await buildDirectAdFilter(input);
            filter.ids = adIds;

            const listings = await getListingRepository().findWithLimit(
                filter,
                { createdAt: -1 },
                batchSize
            );

            const listingMap = new Map(listings.map((l) => [l.id, l]));

            for (const analytics of analyticsBatch) {
                const l = listingMap.get(String(analytics.adId));
                if (l) {
                    mergedAds.push({ ...l, _id: l.id, rankScore: analytics.score });
                    if (mergedAds.length >= limit) break;
                }
            }

            skip += batchSize;
        }

        if (mergedAds.length < limit) {
            const fallbackFilter = await buildDirectAdFilter(input);
            const existingIds = mergedAds.map((ad) => String(ad._id || ad.id)).filter(Boolean);

            if (existingIds.length > 0) {
                fallbackFilter.idsNotIn = existingIds;
            }

            const fallbackListings = await getListingRepository().findWithLimit(
                fallbackFilter,
                { createdAt: -1 },
                limit - mergedAds.length
            );

            const fallbackAds = fallbackListings.map((l) => ({
                ...l,
                _id: l.id,
            }));

            mergedAds = [...mergedAds, ...fallbackAds];
        }

        const payload = {
            ads: mergedAds.map((ad) => normalizeAdImagesForResponse(ad))
        };

        await setCache(cacheKey, payload, TRENDING_CACHE_TTL_SECONDS);
        return payload;
    } catch (error) {
        logger.error('Failed to fetch trending ads', {
            error: error instanceof Error ? error.message : String(error),
            input
        });
        return { ads: [] };
    }
};
