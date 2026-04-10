import mongoose from 'mongoose';
import https from 'https';
import Location from '../../models/Location';
import AdminBoundary from '../../models/AdminBoundary';
import LocationAnalytics from '../../models/LocationAnalytics';
import logger from '../../utils/logger';
import { escapeRegExp, toTitleCase } from '../../utils/stringUtils';
import { formatLocationResponse } from '../../lib/location/formatLocation';
import { toGeoPoint } from '../../../../shared/utils/geoUtils';
export { toGeoPoint };
import { CACHE_KEYS, CACHE_TTLS, getCache, setCache } from '../../utils/redisCache';
import { AppError } from '../../utils/AppError';
import { buildLocationSummary, loadHierarchyMapForLocations, type CanonicalLocationDoc } from '../../utils/locationHierarchy';
import {
    asString,
    buildDisplay,
    coerceLocationInput,
    equalsIgnoreCase,
    extractObjectIdString,
    normalizeCoordinates,
    type LocationInputObject
} from '../location/LocationService.helpers';
export { normalizeCoordinates } from '../location/LocationService.helpers';
import {
    type LocationLevel,
    normalizeLocationInput,
    normalizeLocationLevel,
    normalizeLocationNameForSearch
} from '../../utils/locationInputNormalizer';


import {
    LatLng,
    GeoJSONPoint,
    NormalizedLocation,
    NormalizedLocationResponse,
    NormalizeLocationOptions,
    LocationAnalyticsEventType,
    LOCATION_POPULARITY_WEIGHTS,
    HOT_ZONE_SEARCH_THRESHOLD,
    HOT_ZONE_ADS_THRESHOLD,
    HierarchyLevel,
    VERIFIED_LOCATION_STATUS,
    PUBLIC_CANONICAL_LOCATION_FILTER,
    REVERSE_GEOCODE_LEVEL_PRIORITY,
    REVERSE_GEOCODE_SETTLEMENT_LEVELS,
    REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS,
    REVERSE_GEOCODE_REGIONAL_LEVELS,
    REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS,
    LOCATION_AUTOCOMPLETE_LIMIT,
    ATLAS_LOCATION_SEARCH_INDEX,
    SEARCH_RESULT_LEVEL_PRIORITY,
    withPublicCanonicalLocationFilter,
    buildNormalizedFromLocationDoc,
    buildCanonicalDisplay,
    mapLocationDocsToResponses,
    resolveLocationFromDb,
    toLocationObjectId,
    roundCacheCoord,
    buildReverseGeocodeCacheKey,
    getActiveLocationById,
    getPublicCanonicalLocationById
} from './_shared/hierarchyLoader';
export const touchLocationAnalytics = async (
    locationId: unknown,
    eventType: LocationAnalyticsEventType,
    increment = 1
): Promise<void> => {
    const objectId = toLocationObjectId(locationId);
    if (!objectId || !Number.isFinite(increment) || increment <= 0) return;

    const fieldMap: Record<LocationAnalyticsEventType, 'searchCount' | 'viewCount' | 'adsCount'> = {
        location_search: 'searchCount',
        ad_view: 'viewCount',
        ad_post: 'adsCount'
    };
    const metricField = fieldMap[eventType];
    const now = new Date();

    await LocationAnalytics.collection.updateOne(
        { locationId: objectId },
        [
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
                                    { $multiply: [{ $ifNull: ['$adsCount', 0] }, LOCATION_POPULARITY_WEIGHTS.adsCount] },
                                    { $multiply: [{ $ifNull: ['$searchCount', 0] }, LOCATION_POPULARITY_WEIGHTS.searchCount] },
                                    { $multiply: [{ $ifNull: ['$viewCount', 0] }, LOCATION_POPULARITY_WEIGHTS.viewCount] }
                                ]
                            },
                            2
                        ]
                    },
                    isHotZone: {
                        $or: [
                            { $gte: [{ $ifNull: ['$searchCount', 0] }, HOT_ZONE_SEARCH_THRESHOLD] },
                            { $gte: [{ $ifNull: ['$adsCount', 0] }, HOT_ZONE_ADS_THRESHOLD] }
                        ]
                    }
                }
            }
        ],
        { upsert: true }
    );
};

export const touchLocationSearchAnalytics = async (
    locationIds: Array<unknown>
): Promise<void> => {
    const unique = Array.from(
        new Set(
            locationIds
                .map((value) => asString(value))
                .filter((value): value is string => Boolean(value))
        )
    );
    if (unique.length === 0) return;

    await Promise.all(
        unique.map((locationId) =>
            touchLocationAnalytics(locationId, 'location_search', 1).catch((error) => {
                logger.warn('Failed to track location search analytics', {
                    locationId,
                    error: error instanceof Error ? error.message : String(error)
                });
            })
        )
    );
};

export const logLocationEvent = async (payload: unknown) => {
    const event = coerceLocationInput(payload);
    const locationId = extractObjectIdString(event);
    const type = asString((event as Record<string, unknown>).eventType) as LocationAnalyticsEventType | undefined;
    if (locationId && type) {
        const location = await getActiveLocationById(locationId);
        if (!location) {
            throw new AppError('Invalid or inactive location', 404, 'LOCATION_NOT_FOUND');
        }
        await touchLocationAnalytics(locationId, type, 1);
    }
    return true;
};

