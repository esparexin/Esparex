import mongoose from 'mongoose';
import { env } from '../../../config/env';
import Location from '../../../models/Location';
import { toTitleCase } from '../../../utils/stringUtils';
import { toGeoPoint } from '../../../../../shared/utils/geoUtils';
export { toGeoPoint };
import { CACHE_KEYS } from '../../../utils/redisCache';
import { AppError } from '../../../utils/AppError';
import { buildLocationSummary, loadHierarchyMapForLocations, type CanonicalLocationDoc } from '../../../utils/locationHierarchy';
import {
    asString,
    buildDisplay,
    coerceLocationInput,
    extractObjectIdString,
    normalizeCoordinates,
    type LocationInputObject
} from '../../location/LocationService.helpers';
export { normalizeCoordinates } from '../../location/LocationService.helpers';
import {
    type LocationLevel,
    normalizeLocationNameForSearch
} from '../../../utils/locationInputNormalizer';
import { formatLocationResponse } from '../../../lib/location/formatLocation';

export interface LatLng {
    lat: number;
    lng: number;
}

export interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number];
}

export interface NormalizedLocation {
    locationId?: mongoose.Types.ObjectId;
    id?: string;
    parentId?: string | null;
    path?: string[];
    name?: string;
    city: string;
    state: string;
    country: string;
    level?: string;
    display: string;
    address?: string;
    pincode?: string;
    coordinates?: GeoJSONPoint;
    isActive?: boolean;
    verificationStatus?: string;
}

export interface NormalizedLocationResponse {
    id?: string;
    locationId?: string;
    parentId?: string | null;
    path?: string[];
    name?: string;
    /** @deprecated Use `display` instead */
    displayName?: string;
    display: string;
    /** @deprecated Use `display` instead */
    formattedAddress: string;
    address?: string;
    city: string;
    state: string;
    country: string;
    level?: string;
    pincode?: string;
    coordinates?: GeoJSONPoint;
    isActive?: boolean;
    verificationStatus?: string;
}

export interface NormalizeLocationOptions {
    requireLocationId?: boolean;
    defaultCountry?: string;
}

export type LocationAnalyticsEventType =
    | 'location_search'
    | 'ad_view'
    | 'ad_post';

export const LOCATION_POPULARITY_WEIGHTS = {
    adsCount: 0.3,
    searchCount: 0.2,
    viewCount: 0.2
} as const;

export const HOT_ZONE_SEARCH_THRESHOLD = 100;
export const HOT_ZONE_ADS_THRESHOLD = 50;
export type HierarchyLevel = LocationLevel;
export const VERIFIED_LOCATION_STATUS = 'verified' as const;
export const PUBLIC_CANONICAL_LOCATION_FILTER = {
    isActive: true,
    // Legacy canonical master-data rows were imported before verificationStatus
    // existed. Treat missing status as public/verified until data is backfilled.
    verificationStatus: { $in: [VERIFIED_LOCATION_STATUS, null] },
} as const;
export const REVERSE_GEOCODE_LEVEL_PRIORITY: Record<HierarchyLevel, number> = {
    country: 1,
    state: 2,
    district: 3,
    city: 4,
    area: 5,
    village: 6
};
export const REVERSE_GEOCODE_SETTLEMENT_LEVELS: HierarchyLevel[] = ['area', 'village', 'city', 'district'];
export const REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS = 50_000;
export const REVERSE_GEOCODE_REGIONAL_LEVELS: HierarchyLevel[] = ['state', 'country'];
export const REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS = 250_000;
export const LOCATION_AUTOCOMPLETE_LIMIT = 10;
export const ATLAS_LOCATION_SEARCH_INDEX = env.ATLAS_LOCATION_SEARCH_INDEX;
export const SEARCH_RESULT_LEVEL_PRIORITY: Record<string, number> = {
    city: 1,
    district: 2,
    area: 3,
    village: 4,
    state: 5,
    country: 6
};
export const withPublicCanonicalLocationFilter = <T extends Record<string, unknown>>(query: T) => ({
    ...PUBLIC_CANONICAL_LOCATION_FILTER,
    ...query,
});


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

export const buildNormalizedFromLocationDoc = (loc: LocationInputObject): NormalizedLocation => {
    const coords = normalizeCoordinates(loc?.coordinates);

    // city/state flat fields removed from schema (Sprint 3). Derive from name + level.
    const city = toTitleCase(asString(loc?.name) || '');
    const state = toTitleCase(asString((loc as { state?: unknown })?.state) || asString(loc?.country) || '');
    const country = toTitleCase(asString(loc?.country) || '');
    const fallbackDisplay = asString(loc?.name) || asString(loc?.display);
    const rawId = asString(loc?._id);
    const locationId =
        rawId && mongoose.Types.ObjectId.isValid(rawId)
            ? new mongoose.Types.ObjectId(rawId)
            : undefined;

    return {
        id: rawId,
        locationId,
        parentId: asString(loc.parentId) || null,
        path: Array.isArray(loc.path)
            ? loc.path
                .map((entry) => asString(entry))
                .filter((entry): entry is string => Boolean(entry))
            : undefined,
        name: asString(loc?.name) || city,
        city,
        state,
        country,
        level: asString(loc?.level) || undefined,
        display: buildDisplay(city, state, fallbackDisplay),
        coordinates: coords,
        isActive: loc.isActive !== undefined ? Boolean(loc.isActive) : true,
        verificationStatus: asString(loc.verificationStatus) || 'pending',
    };
};

export const buildCanonicalDisplay = ({
    level,
    name,
    city,
    state,
    fallbackDisplay,
}: {
    level?: string;
    name: string;
    city: string;
    state: string;
    fallbackDisplay?: string;
}) => {
    if (level === 'country' || level === 'state') {
        return name || fallbackDisplay || 'Unknown Location';
    }
    if ((level === 'area' || level === 'village') && city) {
        return `${name}, ${city}`;
    }
    if (state) {
        return `${name}, ${state}`;
    }
    if (city && city !== name) {
        return `${name}, ${city}`;
    }
    return fallbackDisplay || name || 'Unknown Location';
};

export const mapLocationDocsToResponses = async (
    docs: LocationInputObject[]
): Promise<NormalizedLocationResponse[]> => {
    if (docs.length === 0) return [];

    const hierarchyMap = await loadHierarchyMapForLocations(
        docs as Array<CanonicalLocationDoc | null | undefined>
    );

    return docs.map((loc) => {
        const normalized = buildNormalizedFromLocationDoc(loc);
        const summary = buildLocationSummary(loc as CanonicalLocationDoc, hierarchyMap);
        const resolvedName = asString(loc?.name) || normalized.name || summary.name || summary.city || '';
        const resolvedCity =
            normalized.level === 'state' || normalized.level === 'country'
                ? normalized.city
                : summary.city || normalized.city;
        const resolvedState = summary.state || normalized.state;
        const resolvedCountry = summary.country || normalized.country;

        return mapToLocationResponse({
            ...normalized,
            name: resolvedName,
            city: resolvedCity,
            state: resolvedState,
            country: resolvedCountry,
            display: buildCanonicalDisplay({
                level: normalized.level,
                name: resolvedName,
                city: resolvedCity,
                state: resolvedState,
                fallbackDisplay: asString(loc?.display) || normalized.display,
            }),
        });
    });
};

export const resolveLocationFromDb = async (input: unknown): Promise<NormalizedLocation | null> => {
    const normalized = coerceLocationInput(input);

    const rawLocationId = extractObjectIdString(normalized);
    if (rawLocationId) {
        if (!mongoose.Types.ObjectId.isValid(rawLocationId)) {
            throw new AppError('Invalid location ID format', 400, 'INVALID_LOCATION_ID');
        }

        const loc = await Location.findOne({ _id: rawLocationId, isActive: true }).lean();
        if (!loc) {
            throw new AppError('Invalid or inactive location', 404, 'LOCATION_NOT_FOUND');
        }
        return buildNormalizedFromLocationDoc(loc);
    }

    const cityCandidate =
        asString(normalized.city) ||
        asString(normalized.name) ||
        asString(normalized.display) ||
        asString(normalized.formattedAddress);
    if (!cityCandidate) return null;

    const normalizedCityCandidate = normalizeLocationNameForSearch(cityCandidate);
    const cityRegex = new RegExp(`^${cityCandidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    // city/state flat fields removed in Sprint 3 — query by name + level
    const loc = await Location.findOne({
        isActive: true,
        $or: [
            { normalizedName: normalizedCityCandidate },
            { name: cityRegex }
        ],
    })
        .sort({ priority: -1, createdAt: 1 })
        .lean();

    if (!loc) return null;

    return buildNormalizedFromLocationDoc(loc);
};

/**
 * Resolves and normalizes location data from various input formats.
 * Master logic for coordinate flipping [lng, lat] -> {lat, lng}
 */
export const toLocationObjectId = (locationId: unknown): mongoose.Types.ObjectId | null => {
    const value = asString(locationId);
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        return null;
    }
    return new mongoose.Types.ObjectId(value);
};

export const roundCacheCoord = (value: number): string => Number(value.toFixed(3)).toString();

export const buildReverseGeocodeCacheKey = (lat: number, lng: number): string =>
    CACHE_KEYS.reverseGeocode(roundCacheCoord(lat), roundCacheCoord(lng));

export const getActiveLocationById = async (locationId: unknown) => {
    const objectId = toLocationObjectId(locationId);
    if (!objectId) return null;

    return Location.findOne({ _id: objectId, isActive: true })
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .lean();
};

export const getPublicCanonicalLocationById = async (locationId: unknown) => {
    const objectId = toLocationObjectId(locationId);
    if (!objectId) return null;

    return Location.findOne(withPublicCanonicalLocationFilter({ _id: objectId }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .lean();
};
