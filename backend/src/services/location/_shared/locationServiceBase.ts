/**
 * locationServiceBase.ts
 * Shared re-export barrel for all Location sub-services.
 * Eliminates the identical 63-line import block duplicated across
 * LocationNormalizer, LocationSearchService, LocationHierarchyService,
 * LocationAnalyticsService, and ReverseGeocodeService.
 */

export { default as mongoose } from 'mongoose';
export { default as https } from 'https';
export { default as Location } from '../../../models/Location';
export { default as AdminBoundary } from '../../../models/AdminBoundary';
export { default as LocationAnalytics } from '../../../models/LocationAnalytics';
export { default as logger } from '../../../utils/logger';
export { escapeRegExp, toTitleCase } from '../../../utils/stringUtils';
export { formatLocationResponse } from '../../../lib/location/formatLocation';
export { toGeoPoint } from '../../../../../shared/utils/geoUtils';
export { CACHE_KEYS, CACHE_TTLS, getCache, setCache } from '../../../utils/redisCache';
export { AppError } from '../../../utils/AppError';
export {
    buildLocationSummary,
    loadHierarchyMapForLocations,
} from '../../../utils/locationHierarchy';
export type { CanonicalLocationDoc } from '../../../utils/locationHierarchy';
export {
    asString,
    buildDisplay,
    coerceLocationInput,
    equalsIgnoreCase,
    extractObjectIdString,
    normalizeCoordinates,
} from '../LocationService.helpers';
export type { LocationInputObject } from '../LocationService.helpers';
export {
    normalizeLocationInput,
    normalizeLocationLevel,
    normalizeLocationNameForSearch,
} from '../../../utils/locationInputNormalizer';
export type { LocationLevel } from '../../../utils/locationInputNormalizer';
export type {
    LatLng,
    GeoJSONPoint,
    NormalizedLocation,
    NormalizedLocationResponse,
    NormalizeLocationOptions,
    LocationAnalyticsEventType,
    HierarchyLevel,
} from './hierarchyLoader';
export {
    LOCATION_POPULARITY_WEIGHTS,
    HOT_ZONE_SEARCH_THRESHOLD,
    HOT_ZONE_ADS_THRESHOLD,
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
} from './hierarchyLoader';
