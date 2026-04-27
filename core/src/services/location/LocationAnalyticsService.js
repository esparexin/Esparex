"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logLocationEvent = exports.touchLocationSearchAnalytics = exports.touchLocationAnalytics = exports.normalizeCoordinates = exports.toGeoPoint = void 0;
const locationServiceBase_1 = require("./_shared/locationServiceBase");
var locationServiceBase_2 = require("./_shared/locationServiceBase");
Object.defineProperty(exports, "toGeoPoint", { enumerable: true, get: function () { return locationServiceBase_2.toGeoPoint; } });
Object.defineProperty(exports, "normalizeCoordinates", { enumerable: true, get: function () { return locationServiceBase_2.normalizeCoordinates; } });
const touchLocationAnalytics = async (locationId, eventType, increment = 1) => {
    const objectId = (0, locationServiceBase_1.toLocationObjectId)(locationId);
    if (!objectId || !Number.isFinite(increment) || increment <= 0)
        return;
    const fieldMap = {
        location_search: 'searchCount',
        ad_view: 'viewCount',
        ad_post: 'adsCount'
    };
    const metricField = fieldMap[eventType];
    const now = new Date();
    await locationServiceBase_1.LocationAnalytics.collection.updateOne({ locationId: objectId }, [
        {
            $set: {
                locationId: objectId,
                adsCount: { $ifNull: ['$adsCount', 0] },
                searchCount: { $ifNull: ['$searchCount', 0] },
                viewCount: { $ifNull: ['$viewCount', 0] }
            }
        },
        {
            $set: {
                [metricField]: { $add: [`$${metricField}`, increment] },
                lastUpdated: now
            }
        },
        {
            $set: {
                popularityScore: {
                    $round: [
                        {
                            $add: [
                                { $multiply: [{ $ifNull: ['$adsCount', 0] }, locationServiceBase_1.LOCATION_POPULARITY_WEIGHTS.adsCount] },
                                { $multiply: [{ $ifNull: ['$searchCount', 0] }, locationServiceBase_1.LOCATION_POPULARITY_WEIGHTS.searchCount] },
                                { $multiply: [{ $ifNull: ['$viewCount', 0] }, locationServiceBase_1.LOCATION_POPULARITY_WEIGHTS.viewCount] }
                            ]
                        },
                        2
                    ]
                },
                isHotZone: {
                    $or: [
                        { $gte: [{ $ifNull: ['$searchCount', 0] }, locationServiceBase_1.HOT_ZONE_SEARCH_THRESHOLD] },
                        { $gte: [{ $ifNull: ['$adsCount', 0] }, locationServiceBase_1.HOT_ZONE_ADS_THRESHOLD] }
                    ]
                }
            }
        }
    ], { upsert: true });
};
exports.touchLocationAnalytics = touchLocationAnalytics;
const touchLocationSearchAnalytics = async (locationIds) => {
    const unique = Array.from(new Set(locationIds
        .map((value) => (0, locationServiceBase_1.asString)(value))
        .filter((value) => Boolean(value))));
    if (unique.length === 0)
        return;
    await Promise.all(unique.map((locationId) => (0, exports.touchLocationAnalytics)(locationId, 'location_search', 1).catch((error) => {
        locationServiceBase_1.logger.warn('Failed to track location search analytics', {
            locationId,
            error: error instanceof Error ? error.message : String(error)
        });
    })));
};
exports.touchLocationSearchAnalytics = touchLocationSearchAnalytics;
const logLocationEvent = async (payload) => {
    const event = (0, locationServiceBase_1.coerceLocationInput)(payload);
    const locationId = (0, locationServiceBase_1.extractObjectIdString)(event);
    const type = (0, locationServiceBase_1.asString)(event.eventType);
    if (locationId && type) {
        const location = await (0, locationServiceBase_1.getActiveLocationById)(locationId);
        if (!location) {
            throw new locationServiceBase_1.AppError('Invalid or inactive location', 404, 'LOCATION_NOT_FOUND');
        }
        await (0, exports.touchLocationAnalytics)(locationId, type, 1);
    }
    return true;
};
exports.logLocationEvent = logLocationEvent;
//# sourceMappingURL=LocationAnalyticsService.js.map