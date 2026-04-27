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
exports.SmartAlertModel = exports.getAlertDeliveryLogs = exports.processAdForAlerts = exports.findMatchingGeoAlerts = void 0;
const SmartAlert_1 = __importDefault(require("@core/models/SmartAlert"));
const AlertDeliveryLog_1 = __importDefault(require("@core/models/AlertDeliveryLog"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const mongoGeoUtils_1 = require("@core/utils/mongoGeoUtils");
const redisCache_1 = require("@core/utils/redisCache");
const crypto_1 = __importDefault(require("crypto"));
const idUtils_1 = require("@core/utils/idUtils");
const toFiniteNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return undefined;
};
const buildSmartAlertQuery = (criteria) => {
    const and = [{ isActive: true }];
    const categoryId = (0, idUtils_1.toObjectId)(criteria.categoryId);
    if (categoryId) {
        and.push({
            $or: [
                { 'criteria.categoryId': { $exists: false } },
                { 'criteria.categoryId': null },
                { 'criteria.categoryId': categoryId }
            ]
        });
    }
    const brandId = (0, idUtils_1.toObjectId)(criteria.brandId);
    if (brandId) {
        and.push({
            $or: [
                { 'criteria.brandId': { $exists: false } },
                { 'criteria.brandId': null },
                { 'criteria.brandId': brandId }
            ]
        });
    }
    const modelId = (0, idUtils_1.toObjectId)(criteria.modelId);
    if (modelId) {
        and.push({
            $or: [
                { 'criteria.modelId': { $exists: false } },
                { 'criteria.modelId': null },
                { 'criteria.modelId': modelId }
            ]
        });
    }
    const locationId = (0, idUtils_1.toObjectId)(criteria.locationId);
    // PR 8 — Smart Alert path-match: include parent-level locationIds so that
    // a state-level alert fires for city-level ads (e.g. alert for Maharashtra
    // triggers on a Mumbai ad because Mumbai's locationPath includes Maharashtra).
    const parentLocationIds = (criteria.locationParentIds ?? [])
        .map((id) => (0, idUtils_1.toObjectId)(id))
        .filter((id) => id !== null);
    const locationCandidates = [
        ...(locationId ? [locationId] : []),
        ...parentLocationIds,
    ];
    if (locationCandidates.length > 0) {
        and.push({
            $or: [
                { 'criteria.locationId': { $exists: false } },
                { 'criteria.locationId': null },
                { 'criteria.locationId': { $in: locationCandidates } }
            ]
        });
    }
    const price = toFiniteNumber(criteria.price) ??
        toFiniteNumber(criteria.maxPrice) ??
        toFiniteNumber(criteria.minPrice);
    if (typeof price === 'number') {
        and.push({
            $or: [
                { 'criteria.minPrice': { $exists: false } },
                { 'criteria.minPrice': null },
                { 'criteria.minPrice': { $lte: price } }
            ]
        });
        and.push({
            $or: [
                { 'criteria.maxPrice': { $exists: false } },
                { 'criteria.maxPrice': null },
                { 'criteria.maxPrice': { $gte: price } }
            ]
        });
    }
    if (and.length === 1) {
        return and[0] || { isActive: true };
    }
    return { $and: and };
};
const matchesAlertKeywords = (alertKeywords, adText) => {
    if (typeof alertKeywords !== 'string' || alertKeywords.trim().length === 0)
        return true;
    if (typeof adText !== 'string' || adText.trim().length === 0)
        return false;
    const text = adText.toLowerCase();
    const tokens = alertKeywords
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
    if (tokens.length === 0)
        return true;
    return tokens.every((token) => text.includes(token));
};
/**
 * Find Smart Alerts that match the area of a newly created Ad.
 *
 * Logic:
 * 1. Alerts store { coordinates: [lng, lat], radiusKm: N }
 * 2. Ad location is [adLng, adLat]
 * 3. Match: Distance(Alert, Ad) <= Alert.radiusKm
 *
 * Results are cached per (lat, lng, criteria) for 60 seconds to prevent
 * repeated $geoNear aggregations on sequential ad activations.
 */
const findMatchingGeoAlerts = async (adCoords, criteria) => {
    if (!adCoords || adCoords.length !== 2)
        return [];
    const [adLng, adLat] = adCoords;
    // Deterministic cache key from coords + criteria
    const criteriaHash = crypto_1.default
        .createHash('sha1')
        .update(JSON.stringify(criteria))
        .digest('hex')
        .substring(0, 12);
    const cacheKey = `smartAlerts:${adLat.toFixed(4)}:${adLng.toFixed(4)}:${criteriaHash}`;
    const cached = await (0, redisCache_1.getCache)(cacheKey);
    if (cached) {
        logger_1.default.debug('Smart alert cache hit', { cacheKey });
        return cached;
    }
    // SSOT: SmartAlert has its own schema keys under `criteria.*`.
    const geoQuery = buildSmartAlertQuery(criteria || {});
    // Use aggregation to find nearest alerts and filter by their specific radius
    const matchingAlerts = await SmartAlert_1.default.aggregate([
        (0, mongoGeoUtils_1.buildGeoNearStage)({
            lng: adLng,
            lat: adLat,
            key: 'coordinates',
            radiusKm: 500, // Hard limit 500km to optimize index usage
            distanceField: 'distanceFromAd',
            query: geoQuery
        }),
        {
            // Filter: distance <= radiusKm * 1000
            $match: {
                $expr: {
                    $lte: ['$distanceFromAd', { $multiply: ['$radiusKm', 1000] }]
                }
            }
        },
        {
            $project: {
                userId: 1,
                name: 1,
                notificationChannels: 1,
                distanceFromAd: 1,
                criteria: 1
            }
        }
    ]);
    const filteredByKeywords = matchingAlerts.filter((alert) => matchesAlertKeywords(alert.criteria?.keywords, criteria?.keywords));
    await (0, redisCache_1.setCache)(cacheKey, filteredByKeywords, 60);
    return filteredByKeywords;
};
exports.findMatchingGeoAlerts = findMatchingGeoAlerts;
const processAdForAlerts = async (adId) => {
    try {
        const Ad = (await Promise.resolve().then(() => __importStar(require('@core/models/Ad')))).default;
        const ad = await Ad.findById(adId);
        if (!ad) {
            logger_1.default.warn(`[AlertMatch] Could not process alerts: Ad ${String(adId)} not found`);
            return;
        }
        if (!ad.location || !ad.location.coordinates || !ad.location.coordinates.coordinates || ad.location.coordinates.coordinates.length !== 2) {
            logger_1.default.error('REGRESSION: Ad missing valid coordinates for smart alerts matching', {
                adId: ad._id,
                status: ad.status,
                hasLocation: !!ad.location,
                hasCoords: !!ad.location?.coordinates
            });
            return;
        }
        const adCoords = [ad.location.coordinates.coordinates[0], ad.location.coordinates.coordinates[1]]; // [lng, lat]
        // Pass full ad as criteria to find exact matches + parent-path matches
        const locationParentIds = Array.isArray(ad.locationPath)
            ? ad.locationPath.map((id) => id.toString())
            : [];
        const matches = await (0, exports.findMatchingGeoAlerts)(adCoords, {
            categoryId: ad.categoryId?.toString(),
            brandId: ad.brandId?.toString(),
            modelId: ad.modelId?.toString(),
            locationId: ad.location.locationId?.toString(),
            locationParentIds,
            price: ad.price,
            minPrice: ad.price,
            maxPrice: ad.price,
            keywords: ad.title
        });
        if (matches.length > 0) {
            logger_1.default.info('[AlertMatch] Found matching smart alerts for new ad', { count: matches.length, adId: ad._id });
            // --- DUPLICATE GUARD: Filter out already delivered alerts ---
            const matchIds = matches.map(m => m._id);
            const alreadyDelivered = await AlertDeliveryLog_1.default.find({
                adId: ad._id,
                alertId: { $in: matchIds }
            }).distinct('alertId');
            const filteredMatches = matches.filter(m => !alreadyDelivered.some(id => id.toString() === m._id.toString()));
            if (filteredMatches.length === 0) {
                logger_1.default.debug('[AlertMatch] All matching alerts already delivered for this ad via idempotency guard', { adId: ad._id });
                return;
            }
            // --- BATCH PROCESSING: Prevent event loop blocking ---
            const BATCH_SIZE = 100;
            for (let i = 0; i < filteredMatches.length; i += BATCH_SIZE) {
                const batch = filteredMatches.slice(i, i + BATCH_SIZE);
                // Extract loop arrays to decouple background execution out of the active batch window.
                const { NotificationIntent } = await Promise.resolve().then(() => __importStar(require('../domain/NotificationIntent')));
                const { NotificationDispatcher } = await Promise.resolve().then(() => __importStar(require('./notification/NotificationDispatcher')));
                const intents = batch.map(match => {
                    const channels = Array.isArray(match.notificationChannels) && match.notificationChannels.length > 0
                        ? match.notificationChannels
                        : ['push', 'in-app'];
                    return NotificationIntent.fromSmartAlert(match.userId.toString(), match.name, ad._id.toString(), match._id.toString(), channels);
                });
                // Note: shadowDispatch currently disabled to trigger FCM push logic actively for Phase-2 verification
                // To rollout silently, set { shadowDispatch: true }
                await NotificationDispatcher.bulkDispatch(intents, { shadowDispatch: false });
                logger_1.default.info('[AlertMatch] Processed batch of smart alert NotificationIntents via Dispatcher', {
                    count: batch.length,
                    totalRemaining: filteredMatches.length - (i + batch.length)
                });
            }
        }
    }
    catch (error) {
        logger_1.default.error('Error processing smart alerts', { error: error instanceof Error ? error.message : String(error) });
    }
};
exports.processAdForAlerts = processAdForAlerts;
const getAlertDeliveryLogs = async (skip, limit) => {
    const [logs, total] = await Promise.all([
        AlertDeliveryLog_1.default.find({})
            .sort({ deliveredAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('alertId', 'name criteria user')
            .populate('adId', 'title price location status')
            .lean(),
        AlertDeliveryLog_1.default.countDocuments(),
    ]);
    return { logs, total };
};
exports.getAlertDeliveryLogs = getAlertDeliveryLogs;
exports.SmartAlertModel = SmartAlert_1.default;
//# sourceMappingURL=SmartAlertService.js.map