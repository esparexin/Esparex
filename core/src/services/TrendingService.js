"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingAds = exports.recordAdAnalyticsEvent = exports.calculateTrendingScore = void 0;
const Ad_1 = __importDefault(require("@core/models/Ad"));
const AdAnalytics_1 = __importDefault(require("@core/models/AdAnalytics"));
const Category_1 = __importDefault(require("@core/models/Category"));
const redisCache_1 = require("@core/utils/redisCache");
const adStatus_1 = require("@core/constants/enums/adStatus");
const logger_1 = __importDefault(require("@core/utils/logger"));
const AdQueryHelpers_1 = require("./adQuery/AdQueryHelpers");
const idUtils_1 = require("@core/utils/idUtils");
const listingType_1 = require("@core/constants/enums/listingType");
const TRENDING_LIMIT_DEFAULT = 20;
const TRENDING_LIMIT_MAX = 20;
const TRENDING_CACHE_TTL_SECONDS = 120;
const SCORE_WEIGHTS = {
    views: 2,
    favorites: 3,
};
const RECENCY_WINDOW_HOURS = 48;
const RECENCY_MAX_BONUS = 12;
const normalizeSegment = (value, fallback) => {
    if (typeof value !== 'string')
        return fallback;
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, '-');
    return normalized.length > 0 ? normalized : fallback;
};
const resolveTrendingCacheKey = (input) => {
    const locationSegment = normalizeSegment(input.locationId || input.location, 'global');
    const categorySegment = normalizeSegment(input.categoryId || input.category, 'all');
    return `trending:${locationSegment}:${categorySegment}`;
};
const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};
const getRecencyBonus = (createdAt) => {
    if (!createdAt)
        return 0;
    const ageMs = Date.now() - createdAt.getTime();
    if (!Number.isFinite(ageMs) || ageMs <= 0)
        return RECENCY_MAX_BONUS;
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours >= RECENCY_WINDOW_HOURS)
        return 0;
    const ratio = Math.max(0, (RECENCY_WINDOW_HOURS - ageHours) / RECENCY_WINDOW_HOURS);
    return Number((RECENCY_MAX_BONUS * ratio).toFixed(4));
};
const calculateTrendingScore = (counters, createdAt) => {
    const baseScore = (counters.views * SCORE_WEIGHTS.views +
        counters.favorites * SCORE_WEIGHTS.favorites);
    return Number((baseScore + getRecencyBonus(createdAt)).toFixed(4));
};
exports.calculateTrendingScore = calculateTrendingScore;
const resolveCategoryId = async (category, categoryId) => {
    const directCategoryId = (0, idUtils_1.toObjectId)(categoryId || category);
    if (directCategoryId)
        return directCategoryId;
    if (!category || category.trim().length === 0)
        return null;
    const lookup = category.trim();
    const found = await Category_1.default.findOne({
        $or: [
            { slug: lookup.toLowerCase() },
            { name: { $regex: `^${lookup.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }
        ]
    })
        .select('_id')
        .lean();
    return found?._id || null;
};
const buildAggregateAdMatch = async (input) => {
    const match = {
        'ad.status': adStatus_1.AD_STATUS.LIVE,
        'ad.isDeleted': { $ne: true },
        'ad.listingType': listingType_1.LISTING_TYPE.AD,
    };
    const locationObjectId = (0, idUtils_1.toObjectId)(input.locationId);
    if (locationObjectId) {
        match['ad.location.locationId'] = locationObjectId;
    }
    else if (typeof input.location === 'string' && input.location.trim().length > 0) {
        const safeLocation = input.location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        match['ad.location.city'] = { $regex: `^${safeLocation}$`, $options: 'i' };
    }
    const resolvedCategoryId = await resolveCategoryId(input.category, input.categoryId);
    if (resolvedCategoryId) {
        match['ad.categoryId'] = resolvedCategoryId;
    }
    return match;
};
const buildDirectAdMatch = async (input) => {
    const match = {
        status: adStatus_1.AD_STATUS.LIVE,
        isDeleted: { $ne: true },
        listingType: listingType_1.LISTING_TYPE.AD,
    };
    const locationObjectId = (0, idUtils_1.toObjectId)(input.locationId);
    if (locationObjectId) {
        match['location.locationId'] = locationObjectId;
    }
    else if (typeof input.location === 'string' && input.location.trim().length > 0) {
        const safeLocation = input.location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        match['location.city'] = { $regex: `^${safeLocation}$`, $options: 'i' };
    }
    const resolvedCategoryId = await resolveCategoryId(input.category, input.categoryId);
    if (resolvedCategoryId) {
        match.categoryId = resolvedCategoryId;
    }
    return match;
};
const recordAdAnalyticsEvent = async (adId, eventType) => {
    const objectId = (0, idUtils_1.toObjectId)(adId);
    if (!objectId)
        return;
    const incrementPath = eventType === 'view'
        ? 'views'
        : 'favorites';
    try {
        const ad = await Ad_1.default.findById(objectId)
            .select('_id createdAt status isDeleted')
            .lean();
        if (!ad || ad.isDeleted || ad.status !== adStatus_1.AD_STATUS.LIVE)
            return;
        const snapshot = await AdAnalytics_1.default.findOneAndUpdate({ adId: objectId }, {
            $inc: { [incrementPath]: 1 },
            $setOnInsert: {
                adId: objectId,
                views: 0,
                favorites: 0,
                score: 0,
            }
        }, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }).lean();
        if (!snapshot)
            return;
        const score = (0, exports.calculateTrendingScore)({
            views: toFiniteNumber(snapshot.views),
            favorites: toFiniteNumber(snapshot.favorites),
        }, ad.createdAt || null);
        await AdAnalytics_1.default.updateOne({ adId: objectId }, { $set: { score } });
    }
    catch (error) {
        logger_1.default.warn('Failed to record ad analytics event', {
            adId: String(objectId),
            eventType,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.recordAdAnalyticsEvent = recordAdAnalyticsEvent;
const getTrendingAds = async (input) => {
    const limit = Math.max(1, Math.min(TRENDING_LIMIT_MAX, Math.floor(Number(input.limit) || TRENDING_LIMIT_DEFAULT)));
    const cacheKey = resolveTrendingCacheKey(input);
    try {
        const cached = await (0, redisCache_1.getCache)(cacheKey);
        if (cached && Array.isArray(cached.ads)) {
            return cached;
        }
        const adMatch = await buildAggregateAdMatch(input);
        const pipeline = [
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
        const rankedAds = await AdAnalytics_1.default.aggregate(pipeline);
        let mergedAds = rankedAds;
        if (mergedAds.length < limit) {
            const fallbackMatch = await buildDirectAdMatch(input);
            const existingIds = mergedAds
                .map((ad) => (0, idUtils_1.toObjectId)(ad._id))
                .filter((id) => Boolean(id));
            if (existingIds.length > 0) {
                fallbackMatch._id = { $nin: existingIds };
            }
            const fallbackAds = await Ad_1.default.find(fallbackMatch)
                .sort({ createdAt: -1 })
                .limit(limit - mergedAds.length)
                .lean();
            mergedAds = [...mergedAds, ...fallbackAds];
        }
        const payload = {
            ads: mergedAds.map((ad) => (0, AdQueryHelpers_1.normalizeAdImagesForResponse)(ad))
        };
        await (0, redisCache_1.setCache)(cacheKey, payload, TRENDING_CACHE_TTL_SECONDS);
        return payload;
    }
    catch (error) {
        logger_1.default.error('Failed to fetch trending ads', {
            error: error instanceof Error ? error.message : String(error),
            input
        });
        return { ads: [] };
    }
};
exports.getTrendingAds = getTrendingAds;
//# sourceMappingURL=TrendingService.js.map