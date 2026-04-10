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
export const normalizeLocation = async (
    input: unknown,
    options: NormalizeLocationOptions = {}
): Promise<NormalizedLocation | null> => {
    const normalizedInput = coerceLocationInput(input);
    if (!normalizedInput || Object.keys(normalizedInput).length === 0) return null;
    const rawLocationId = extractObjectIdString(normalizedInput);

    const hasLocationHints = Boolean(
        rawLocationId ||
        asString(normalizedInput.city) ||
        asString(normalizedInput.state) ||
        asString(normalizedInput.name) ||
        asString(normalizedInput.display) ||
        asString(normalizedInput.formattedAddress) ||
        normalizeCoordinates(normalizedInput)
    );

    if (!hasLocationHints) {
        return null;
    }

    if (options.requireLocationId && !rawLocationId) {
        throw new AppError('Valid location selection is required', 400, 'LOCATION_REQUIRED');
    }

    const fromDb = await resolveLocationFromDb(normalizedInput);
    const parsedCoords = normalizeCoordinates(normalizedInput) || fromDb?.coordinates;

    if (options.requireLocationId && !fromDb?.locationId) {
        throw new AppError('Valid location selection is required', 400, 'LOCATION_REQUIRED');
    }
    if (options.requireLocationId && fromDb?.verificationStatus !== VERIFIED_LOCATION_STATUS) {
        throw new AppError('Valid verified location selection is required', 400, 'LOCATION_REQUIRED');
    }

    const hasCanonicalLocationId = Boolean(rawLocationId && fromDb?.locationId);

    if (hasCanonicalLocationId && fromDb) {
        const inputCity = toTitleCase(asString(normalizedInput.city) || asString(normalizedInput.name) || '');
        const inputState = toTitleCase(asString(normalizedInput.state) || '');
        const inputCountry = toTitleCase(asString(normalizedInput.country) || '');

        const hasHierarchyMismatch =
            (!equalsIgnoreCase(inputCity, fromDb.city) && inputCity.length > 0) ||
            (!equalsIgnoreCase(inputState, fromDb.state) && inputState.length > 0) ||
            (!equalsIgnoreCase(inputCountry, fromDb.country) && inputCountry.length > 0);

        if (hasHierarchyMismatch) {
            logger.warn('Location hierarchy mismatch detected; canonical locationId values enforced', {
                locationId: rawLocationId,
                input: {
                    city: inputCity || undefined,
                    state: inputState || undefined,
                    country: inputCountry || undefined
                },
                canonical: {
                    city: fromDb.city,
                    state: fromDb.state,
                    country: fromDb.country
                }
            });
        }
    }

    const city = hasCanonicalLocationId
        ? (fromDb?.city || '')
        : toTitleCase(
            asString(normalizedInput.city) ||
            fromDb?.city ||
            asString(normalizedInput.name) ||
            asString(normalizedInput.display) ||
            ''
        );
    const state = hasCanonicalLocationId
        ? (fromDb?.state || '')
        : toTitleCase(asString(normalizedInput.state) || fromDb?.state || '');
    const country = hasCanonicalLocationId
        ? (fromDb?.country || options.defaultCountry || '')
        : toTitleCase(
            asString(normalizedInput.country) || fromDb?.country || options.defaultCountry || ''
        );
    const level = hasCanonicalLocationId
        ? normalizeLocationLevel(fromDb?.level)
        : normalizeLocationLevel(normalizedInput.level) || normalizeLocationLevel(fromDb?.level);

    if (!city && options.requireLocationId) {
        throw new AppError('Location city is required', 400, 'LOCATION_REQUIRED');
    }

    const display =
        asString(normalizedInput.display) ||
        asString(normalizedInput.formattedAddress) ||
        fromDb?.display ||
        buildDisplay(city, state, fromDb?.name);

    return {
        id: fromDb?.id,
        locationId: fromDb?.locationId,
        name: asString(normalizedInput.name) || fromDb?.name || city || undefined,
        city: city || fromDb?.city || '',
        state: state || fromDb?.state || '',
        country,
        level,
        display,
        address: asString(normalizedInput.address) || asString(normalizedInput.formattedAddress),
        pincode: asString(normalizedInput.pincode),
        coordinates: parsedCoords,
        isActive: normalizedInput.isActive !== undefined ? Boolean(normalizedInput.isActive) : fromDb?.isActive,
        verificationStatus: asString(normalizedInput.verificationStatus) || fromDb?.verificationStatus,
    };
};

/**
 * Maps a NormalizedLocation (internal) to a NormalizedLocationResponse (API).
 * Ensures flat latitude/longitude are strictly derived from coordinates.
 */
export const mapToLocationResponse = (
    normalized: NormalizedLocation
): NormalizedLocationResponse => {
    return formatLocationResponse({
        id: normalized.id,
        locationId: normalized.locationId?.toString() || normalized.id,
        parentId: normalized.parentId,
        path: normalized.path,
        name: normalized.name,
        displayName: normalized.name,
        display: normalized.display,
        formattedAddress: normalized.address || normalized.display,
        address: normalized.address,
        city: normalized.city,
        state: normalized.state,
        country: normalized.country,
        level: normalized.level,
        pincode: normalized.pincode,
        coordinates: normalized.coordinates,
        isActive: normalized.isActive,
        verificationStatus: normalized.verificationStatus,
    });
};

export const normalizeLocationResponse = (input: unknown): NormalizedLocationResponse | null => {
    const normalizedInput = coerceLocationInput(input);
    if (!normalizedInput || Object.keys(normalizedInput).length === 0) return null;

    // Use buildNormalizedFromLocationDoc to get the internal shape (sync)
    const internal = buildNormalizedFromLocationDoc(normalizedInput);

    // Ensure we pick up any loose address/pincode from input that buildNormalized might skip
    internal.address = asString(normalizedInput.address) || asString(normalizedInput.formattedAddress) || internal.address;
    internal.pincode = asString(normalizedInput.pincode) || internal.pincode;

    return mapToLocationResponse(internal);
};

