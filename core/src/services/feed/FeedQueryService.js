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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHomeFeed = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("@core/config/env");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const Boost_1 = __importDefault(require("@core/models/Boost"));
const AdSearchService_1 = require("@core/services/ad/AdSearchService");
const AdFeedService_1 = require("@core/services/ad/AdFeedService");
const AdQueryHelpers_1 = require("@core/services/adQuery/AdQueryHelpers");
const mongoGeoUtils_1 = require("@core/utils/mongoGeoUtils");
const logger_1 = __importDefault(require("@core/utils/logger"));
const FeedDecisionEngine_1 = require("../FeedDecisionEngine");
const FeedRankerService_1 = require("./FeedRankerService");
const buildHomeFeed = async (input, limit, cursor) => {
    const { LISTING_TYPE } = await Promise.resolve().then(() => __importStar(require('@core/constants/enums/listingType')));
    const startedAt = Date.now();
    // 1. Resolve Match Criteria
    const baseFilters = {
        listingType: LISTING_TYPE.AD,
        sortBy: 'newest',
        ...(typeof input.location === 'string' && input.location.trim().length > 0
            ? { location: input.location.trim() }
            : {}),
        ...(typeof input.locationId === 'string' && mongoose_1.default.Types.ObjectId.isValid(input.locationId)
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
    const matchStage = await (0, AdSearchService_1.buildAdMatchStage)(baseFilters);
    if (env_1.env.FEED_DEBUG) {
        logger_1.default.debug(`[FeedDebug] Final Match Filter`, { matchStage });
    }
    // 2. Fetch Active Boosts (Fast Indexed Query)
    const now = new Date();
    const boostCandidates = await Boost_1.default.find({
        entityType: 'ad',
        isActive: true,
        startsAt: { $lte: now },
        endsAt: { $gt: now }
    })
        .select('entityId')
        .sort({ createdAt: -1 })
        .limit(200) // Safety cap
        .lean();
    const boostedIds = boostCandidates
        .map((entry) => entry.entityId)
        .filter((id) => id instanceof mongoose_1.default.Types.ObjectId);
    // 2.5 Resolve Geo Location ($geoNear MUST be the first stage if coordinates are present)
    const { lat, lng, hasGeo } = (0, mongoGeoUtils_1.normalizeGeoInput)(input.lat, input.lng);
    const normalizedLevel = typeof input.level === 'string' ? input.level.toLowerCase() : undefined;
    const shouldUseGeo = hasGeo && normalizedLevel !== 'state' && normalizedLevel !== 'country';
    const safeRadius = shouldUseGeo
        ? Math.min(Math.max(Number(input.radiusKm) || 50, 1), 500)
        : 0;
    let geoStage = undefined;
    if (shouldUseGeo) {
        geoStage = (0, mongoGeoUtils_1.buildGeoNearStage)({
            lng,
            lat,
            radiusKm: safeRadius,
            query: matchStage
        });
        // Clear out matchStage so it doesn't run twice (geoStage incorporates it)
        Object.keys(matchStage).forEach(key => delete matchStage[key]);
    }
    // 3. Unified Aggregation
    const pipeline = (0, AdFeedService_1.buildHomeFeedPipeline)(matchStage, boostedIds, limit, geoStage, cursor ?? undefined);
    const [facetResults] = await Ad_1.default.aggregate(pipeline);
    const spotlightAds = (0, FeedRankerService_1.filterBeforeCursor)((facetResults?.spotlight ?? []).map((ad) => ({
        ...ad,
        isSpotlight: true,
        isBoosted: false
    })), cursor);
    const boostedAds = (0, FeedRankerService_1.filterBeforeCursor)((facetResults?.boosted ?? []).map((ad) => ({
        ...ad,
        isSpotlight: false,
        isBoosted: true
    })), cursor);
    const organicAds = (0, FeedRankerService_1.filterBeforeCursor)((facetResults?.organic ?? []).map((ad) => ({
        ...ad,
        isSpotlight: false,
        isBoosted: false
    })), cursor);
    // 4. Merge results
    const merged = (0, FeedRankerService_1.mergeRankedFeed)(spotlightAds, boostedAds, organicAds, limit);
    // 5. Fallback Logic
    let isFallbackResult = false;
    const isStrictLocation = Boolean(input.locationId || input.location || shouldUseGeo);
    if (!cursor && merged.ads.length < 4 && isStrictLocation) {
        isFallbackResult = true;
        const seenIds = new Set(merged.ads.map(FeedRankerService_1.extractAdId).filter(Boolean));
        const engineResult = await FeedDecisionEngine_1.FeedDecisionEngine.getFallbackFeed({
            locationId: input.locationId,
            city: typeof input.location === 'string' ? input.location.trim() : undefined,
            state: input.level === 'state' && typeof input.location === 'string' ? input.location.trim() : undefined,
            lat: shouldUseGeo ? input.lat : undefined,
            lng: shouldUseGeo ? input.lng : undefined,
        }, Array.from(seenIds), limit - merged.ads.length, input.categoryId);
        const sortedBucket = engineResult.ads;
        for (const ad of sortedBucket) {
            if (merged.ads.length >= limit)
                break;
            const id = (0, FeedRankerService_1.extractAdId)(ad);
            if (!id || seenIds.has(id))
                continue;
            seenIds.add(id);
            merged.ads.push(ad);
        }
    }
    const lastAd = merged.ads[merged.ads.length - 1];
    const lastAdCursor = lastAd
        ? {
            createdAt: new Date(String(lastAd.createdAt ?? '')).toISOString(),
            id: (0, FeedRankerService_1.extractObjectIdHex)(lastAd) || String((0, FeedRankerService_1.extractAdId)(lastAd))
        }
        : null;
    logger_1.default.debug('Home feed build timings', {
        durationMs: Date.now() - startedAt,
        adsCount: merged.ads.length,
        isFallback: isFallbackResult
    });
    return {
        ads: merged.ads.map(ad => (0, AdQueryHelpers_1.normalizeAdImagesForResponse)(ad)),
        nextCursor: merged.hasRemaining ? lastAdCursor : null,
        hasMore: merged.hasRemaining && merged.ads.length > 0,
        isFallback: isFallbackResult
    };
};
exports.buildHomeFeed = buildHomeFeed;
//# sourceMappingURL=FeedQueryService.js.map