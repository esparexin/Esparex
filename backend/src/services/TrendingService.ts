import mongoose, { type PipelineStage } from 'mongoose';
import Ad from '../models/Ad';
import AdAnalytics from '../models/AdAnalytics';
import Category from '../models/Category';
import { getCache, setCache } from '../utils/redisCache';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import logger from '../utils/logger';
import { normalizeAdImagesForResponse } from './adQuery/AdQueryHelpers';

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

const toObjectId = (value: unknown): mongoose.Types.ObjectId | null => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    return null;
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

const buildAggregateAdMatch = async (input: TrendingInput): Promise<Record<string, unknown>> => {
    const match: Record<string, unknown> = {
        'ad.status': AD_STATUS.LIVE,
        'ad.isDeleted': { $ne: true },
    };

    const locationObjectId = toObjectId(input.locationId);
    if (locationObjectId) {
        match['ad.location.locationId'] = locationObjectId;
    } else if (typeof input.location === 'string' && input.location.trim().length > 0) {
        const safeLocation = input.location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        match['ad.location.city'] = { $regex: `^${safeLocation}$`, $options: 'i' };
    }

    const resolvedCategoryId = await resolveCategoryId(input.category, input.categoryId);
    if (resolvedCategoryId) {
        match['ad.categoryId'] = resolvedCategoryId;
    }

    return match;
};

const buildDirectAdMatch = async (input: TrendingInput): Promise<Record<string, unknown>> => {
    const match: Record<string, unknown> = {
        status: AD_STATUS.LIVE,
        isDeleted: { $ne: true },
    };

    const locationObjectId = toObjectId(input.locationId);
    if (locationObjectId) {
        match['location.locationId'] = locationObjectId;
    } else if (typeof input.location === 'string' && input.location.trim().length > 0) {
        const safeLocation = input.location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        match['location.city'] = { $regex: `^${safeLocation}$`, $options: 'i' };
    }

    const resolvedCategoryId = await resolveCategoryId(input.category, input.categoryId);
    if (resolvedCategoryId) {
        match.categoryId = resolvedCategoryId;
    }

    return match;
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
        const ad = await Ad.findById(objectId)
            .select('_id createdAt status isDeleted')
            .lean<{ _id: mongoose.Types.ObjectId; createdAt: Date; status: string; isDeleted?: boolean } | null>();

        if (!ad || ad.isDeleted || ad.status !== AD_STATUS.LIVE) return;

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

        const adMatch = await buildAggregateAdMatch(input);
        const pipeline: PipelineStage[] = [
            { $sort: { score: -1, updatedAt: -1 } },
            {
                $lookup: {
                    from: 'ads',
                    localField: 'adId',
                    foreignField: '_id',
                    as: 'ad'
                }
            },
            { $unwind: '$ad' },
            { $match: adMatch },
            { $addFields: { 'ad.rankScore': '$score' } },
            { $replaceRoot: { newRoot: '$ad' } },
            { $limit: limit }
        ];

        const rankedAds = await AdAnalytics.aggregate<Record<string, unknown>>(pipeline);

        let mergedAds = rankedAds;
        if (mergedAds.length < limit) {
            const fallbackMatch = await buildDirectAdMatch(input);
            const existingIds = mergedAds
                .map((ad) => toObjectId((ad as { _id?: unknown })._id))
                .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

            if (existingIds.length > 0) {
                fallbackMatch._id = { $nin: existingIds };
            }

            const fallbackAds = await Ad.find(fallbackMatch)
                .sort({ createdAt: -1 })
                .limit(limit - mergedAds.length)
                .lean<Record<string, unknown>[]>();

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
