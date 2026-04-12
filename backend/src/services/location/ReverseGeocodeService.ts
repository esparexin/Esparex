import mongoose from 'mongoose';
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
import { normalizeLocationResponse } from './LocationNormalizer';
const resolveBoundaryMatch = async (lat: number, lng: number): Promise<NormalizedLocationResponse | null> => {
    const point = { type: 'Point', coordinates: [lng, lat] as [number, number] };
    const boundaries = await AdminBoundary.find({
        geometry: {
            $geoIntersects: {
                $geometry: point
            }
        }
    })
        .select('locationId level')
        .lean<Array<{ locationId: mongoose.Types.ObjectId; level: HierarchyLevel }>>();

    if (boundaries.length === 0) {
        logger.warn('No AdminBoundary found for coordinates; falling back to nearest point search.', { lat, lng });
        return null;
    }

    const boundary = [...boundaries].sort(
        (a, b) => (REVERSE_GEOCODE_LEVEL_PRIORITY[b.level] || 0) - (REVERSE_GEOCODE_LEVEL_PRIORITY[a.level] || 0)
    )[0];

    const stateLocation = await getPublicCanonicalLocationById(boundary?.locationId);
    if (!boundary || !stateLocation) {
        logger.warn('AdminBoundary matched but parent location is missing or inactive.', {
            boundaryId: boundary?.locationId,
            coordinates: { lat, lng }
        });
        return null;
    }

    // After identifying the state, find the nearest city/district within it.
    // This gives users "Hyderabad, Telangana" instead of just "Telangana".
    const nearestCity = await Location.findOne(withPublicCanonicalLocationFilter({
        level: { $in: REVERSE_GEOCODE_SETTLEMENT_LEVELS },
        parentId: boundary.locationId,
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS,
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .lean<LocationInputObject | null>();

    if (nearestCity) {
        const [mappedCity] = await mapLocationDocsToResponses([nearestCity as LocationInputObject]);
        if (mappedCity) return mappedCity;
    }

    // Fallback to state-level response if no city found within range
    const [mappedState] = await mapLocationDocsToResponses([stateLocation as LocationInputObject]);
    return mappedState || null;
};



const findNearestReverseGeocodeCandidate = async (
    lat: number,
    lng: number
): Promise<LocationInputObject | null> => {
    const nearestSettlement = await Location.findOne(withPublicCanonicalLocationFilter({
        level: { $in: REVERSE_GEOCODE_SETTLEMENT_LEVELS },
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS,
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .lean<LocationInputObject | null>();

    if (nearestSettlement) {
        return nearestSettlement;
    }

    return Location.findOne(withPublicCanonicalLocationFilter({
        level: { $in: REVERSE_GEOCODE_REGIONAL_LEVELS },
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS,
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .lean<LocationInputObject | null>();
};

export const reverseGeocode = async (
    lat: number,
    lng: number
): Promise<NormalizedLocationResponse | null> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new AppError('Invalid coordinates', 400, 'INVALID_COORDINATES');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new AppError('Coordinates out of range', 400, 'INVALID_COORDINATES');
    }
    if (lat === 0 && lng === 0) {
        throw new AppError('Null-island coordinates are not allowed', 400, 'INVALID_COORDINATES');
    }

    const cacheKey = buildReverseGeocodeCacheKey(lat, lng);
    const cached = await getCache(cacheKey);
    if (cached) {
        return cached as NormalizedLocationResponse;
    }

    const boundaryMatch = await resolveBoundaryMatch(lat, lng);
    if (boundaryMatch) {
        await setCache(cacheKey, boundaryMatch, CACHE_TTLS.REVERSE_GEOCODE);
        return boundaryMatch;
    }

    const nearest = await findNearestReverseGeocodeCandidate(lat, lng);

    if (!nearest) return null;

    const [response] = await mapLocationDocsToResponses([nearest as LocationInputObject]);
    if (!response) return null;
    await setCache(cacheKey, response, CACHE_TTLS.REVERSE_GEOCODE);
    return response;
};
