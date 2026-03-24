import mongoose from 'mongoose';
import https from 'https';
import Location from '../models/Location';
import AdminBoundary from '../models/AdminBoundary';
import LocationAnalytics from '../models/LocationAnalytics';
import logger from '../utils/logger';
import { escapeRegExp } from '../utils/stringUtils';
import { formatLocationResponse } from '../lib/location/formatLocation';
import { toGeoPoint } from '../../../shared/utils/geoUtils';
export { toGeoPoint };
import { CACHE_KEYS, CACHE_TTLS, getCache, setCache } from '../utils/redisCache';
import { AppError } from '../utils/AppError';
import {
    asString,
    buildDisplay,
    coerceLocationInput,
    equalsIgnoreCase,
    extractObjectIdString,
    normalizeCoordinates,
    toTitleCase,
    type LocationInputObject
} from './location/LocationService.helpers';
export { normalizeCoordinates } from './location/LocationService.helpers';
import {
    type LocationLevel,
    normalizeLocationInput,
    normalizeLocationLevel,
    normalizeLocationNameForSearch
} from '../utils/locationInputNormalizer';

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

interface NormalizeLocationOptions {
    requireLocationId?: boolean;
    defaultCountry?: string;
}

export type LocationAnalyticsEventType =
    | 'location_search'
    | 'ad_view'
    | 'ad_post';

const LOCATION_POPULARITY_WEIGHTS = {
    adsCount: 0.3,
    searchCount: 0.2,
    viewCount: 0.2
} as const;

const HOT_ZONE_SEARCH_THRESHOLD = 100;
const HOT_ZONE_ADS_THRESHOLD = 50;
type HierarchyLevel = LocationLevel;
const REVERSE_GEOCODE_LEVEL_PRIORITY: Record<HierarchyLevel, number> = {
    country: 1,
    state: 2,
    district: 3,
    city: 4,
    area: 5,
    village: 6
};
const LOCATION_AUTOCOMPLETE_LIMIT = 10;
const ATLAS_LOCATION_SEARCH_INDEX = process.env.ATLAS_LOCATION_SEARCH_INDEX || 'location_autocomplete';
const SEARCH_RESULT_LEVEL_PRIORITY: Record<string, number> = {
    city: 1,
    district: 2,
    area: 3,
    village: 4,
    state: 5,
    country: 6
};
let hasWarnedAtlasSearchFallback = false;



const buildNormalizedFromLocationDoc = (loc: LocationInputObject): NormalizedLocation => {
    const coords = normalizeCoordinates(loc?.coordinates);

    // city/state flat fields removed from schema (Sprint 3). Derive from name + level.
    const city = toTitleCase(asString(loc?.name) || '');
    const district = toTitleCase(asString((loc as { district?: unknown })?.district) || '');
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

const resolveLocationFromDb = async (input: unknown): Promise<NormalizedLocation | null> => {
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
    const stateCandidate = asString(normalized.state);

    if (!cityCandidate) return null;

    const normalizedCityCandidate = normalizeLocationNameForSearch(cityCandidate);
    const cityRegex = new RegExp(`^${cityCandidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const stateRegex = stateCandidate
        ? new RegExp(`^${stateCandidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        : undefined;

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

const toLocationObjectId = (locationId: unknown): mongoose.Types.ObjectId | null => {
    const value = asString(locationId);
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        return null;
    }
    return new mongoose.Types.ObjectId(value);
};

const roundCacheCoord = (value: number): string => Number(value.toFixed(4)).toString();

const buildReverseGeocodeCacheKey = (lat: number, lng: number): string =>
    CACHE_KEYS.reverseGeocode(roundCacheCoord(lat), roundCacheCoord(lng));

const getActiveLocationById = async (locationId: unknown) => {
    const objectId = toLocationObjectId(locationId);
    if (!objectId) return null;

    return Location.findOne({ _id: objectId, isActive: true })
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .lean();
};

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

export const ingestLocation = async (payload: {
    name: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    coordinates: GeoJSONPoint;
    level?: string;
    [key: string]: unknown;
}): Promise<NormalizedLocationResponse> => {
    if (payload.coordinates?.coordinates) {
        const [lng, lat] = payload.coordinates.coordinates;
        if (lng === 0 && lat === 0) {
            throw new AppError('Invalid null-island coordinate', 400, 'INVALID_COORDINATES');
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const normalizedPayload = await normalizeLocationInput(payload, {
            documentId: new mongoose.Types.ObjectId(),
            resolveHierarchy: true,
            defaultCountry: 'Unknown'
        });

        // Dedup by normalizedName + level + parentId (state field removed Sprint 3)
        let existing = await Location.findOne({
            isActive: true,
            normalizedName: normalizedPayload.normalizedName,
            level: normalizedPayload.level,
            ...(normalizedPayload.parentId ? { parentId: normalizedPayload.parentId } : {})
        }).session(session).lean();

        if (existing) {
            await session.commitTransaction();
            session.endSession();
            return mapToLocationResponse(buildNormalizedFromLocationDoc(existing as LocationInputObject));
        }

        const radiusInRadians = 2 / 6378.1; // 2km radius
        existing = await Location.findOne({
            isActive: true,
            level: normalizedPayload.level,
            coordinates: {
                $geoWithin: {
                    $centerSphere: [normalizedPayload.coordinates.coordinates, radiusInRadians]
                }
            }
        }).session(session).lean();

        if (existing) {
            await session.commitTransaction();
            session.endSession();
            return mapToLocationResponse(buildNormalizedFromLocationDoc(existing as LocationInputObject));
        }

        // city/state flat fields omitted — use parentId/path hierarchy (Sprint 3)
        const [created] = await Location.create([{
            _id: normalizedPayload.documentId,
            name: normalizedPayload.name,
            normalizedName: normalizedPayload.normalizedName,
            slug: normalizedPayload.slug,
            country: normalizedPayload.country,
            level: normalizedPayload.level,
            parentId: normalizedPayload.parentId,
            path: normalizedPayload.path,
            coordinates: normalizedPayload.coordinates,
            aliases: normalizedPayload.aliases,
            isActive: true,
            isPopular: false
        }], { session });

        await session.commitTransaction();
        session.endSession();

        if (Array.isArray(created) && created.length > 0) {
            const createdObject = created[0].toObject();
            return mapToLocationResponse(buildNormalizedFromLocationDoc(createdObject as LocationInputObject));
        }
        throw new AppError('Failed to create location document', 500, 'LOCATION_CREATE_FAILED');
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

/** Fetch city+state for a 6-digit Indian pincode via Nominatim (used as fallback) */
const lookupPincodeViaNominatim = (pincode: string): Promise<NormalizedLocationResponse | null> => {
    return new Promise((resolve) => {
        const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode)}&country=India&format=json&limit=1&addressdetails=1`;
        const req = https.get(url, { headers: { 'User-Agent': 'EsparexApp/1.0' } }, (res) => {
            let data = '';
            res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
            res.on('end', () => {
                try {
                    const results = JSON.parse(data) as Array<{
                        address?: { city?: string; town?: string; village?: string; county?: string; state?: string; postcode?: string };
                        lat?: string; lon?: string; display_name?: string;
                    }>;
                    const first = results[0];
                    if (!first?.address) return resolve(null);
                    const addr = first.address;
                    const city = addr.city || addr.town || addr.village || addr.county || '';
                    const state = addr.state || '';
                    if (!city || !state) return resolve(null);
                    const lat = parseFloat(first.lat ?? '');
                    const lon = parseFloat(first.lon ?? '');
                    resolve(mapToLocationResponse({
                        name: city,
                        city,
                        state,
                        country: 'India',
                        level: 'city',
                        display: `${city}, ${state}`,
                        address: `${city}, ${state} - ${pincode}`,
                        pincode,
                        isActive: true,
                        coordinates: !isNaN(lat) && !isNaN(lon) ? { type: 'Point', coordinates: [lon, lat] } : undefined,
                    }));
                } catch {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
        req.setTimeout(4000, () => { req.destroy(); resolve(null); });
    });
};

export const searchLocations = async (
    q: string,
    popular?: boolean
): Promise<NormalizedLocationResponse[]> => {
    const query = q?.trim() || '';

    if (popular) {
        return getPopularLocations();
    }

    if (query.length < 2) return [];

    const normalizedQuery = normalizeLocationNameForSearch(query);
    if (!normalizedQuery) return [];

    const escapedNormalizedQuery = escapeRegExp(normalizedQuery);

    try {
        const atlasResults = await Location.aggregate<Array<LocationInputObject & {
            normalizedName?: string;
            priority?: number;
            isPopular?: boolean;
            searchScore?: number;
            exactPrefixRank?: number;
            levelPriority?: number;
        }>>([
            {
                $search: {
                    index: ATLAS_LOCATION_SEARCH_INDEX,
                    compound: {
                        filter: [
                            {
                                equals: {
                                    path: 'isActive',
                                    value: true
                                }
                            }
                        ],
                        should: [
                            {
                                autocomplete: {
                                    query: normalizedQuery,
                                    path: 'normalizedName',
                                    tokenOrder: 'sequential',
                                    fuzzy: { maxEdits: 1, prefixLength: Math.min(2, normalizedQuery.length) },
                                    score: { boost: { value: 8 } }
                                }
                            },
                            {
                                autocomplete: {
                                    query,
                                    path: 'name',
                                    tokenOrder: 'sequential',
                                    fuzzy: { maxEdits: 1, prefixLength: Math.min(2, query.length) },
                                    score: { boost: { value: 6 } }
                                }
                            },
                            {
                                autocomplete: {
                                    query,
                                    path: 'aliases',
                                    tokenOrder: 'sequential',
                                    fuzzy: { maxEdits: 1, prefixLength: Math.min(2, query.length) },
                                    score: { boost: { value: 5 } }
                                }
                            }
                        ],
                        minimumShouldMatch: 1
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    city: 1,
                    state: 1,
                    country: 1,
                    level: 1,
                    coordinates: 1,
                    isPopular: 1,
                    isActive: 1,
                    verificationStatus: 1,
                    parentId: 1,
                    path: 1,
                    normalizedName: 1,
                    priority: 1,
                    searchScore: { $meta: 'searchScore' }
                }
            },
            {
                $addFields: {
                    exactPrefixRank: {
                        $cond: [
                            {
                                $regexMatch: {
                                    input: { $ifNull: ['$normalizedName', ''] },
                                    regex: `^${escapedNormalizedQuery}`
                                }
                            },
                            0,
                            1
                        ]
                    },
                    levelPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$level', 'city'] }, then: SEARCH_RESULT_LEVEL_PRIORITY.city },
                                { case: { $eq: ['$level', 'district'] }, then: SEARCH_RESULT_LEVEL_PRIORITY.district },
                                { case: { $eq: ['$level', 'area'] }, then: SEARCH_RESULT_LEVEL_PRIORITY.area },
                                { case: { $eq: ['$level', 'village'] }, then: SEARCH_RESULT_LEVEL_PRIORITY.village },
                                { case: { $eq: ['$level', 'state'] }, then: SEARCH_RESULT_LEVEL_PRIORITY.state },
                                { case: { $eq: ['$level', 'country'] }, then: SEARCH_RESULT_LEVEL_PRIORITY.country }
                            ],
                            default: 99
                        }
                    }
                }
            },
            {
                $sort: {
                    exactPrefixRank: 1,
                    isPopular: -1,
                    priority: -1,
                    levelPriority: 1,
                    name: 1
                }
            },
            { $limit: LOCATION_AUTOCOMPLETE_LIMIT }
        ]);

        if (atlasResults.length > 0) {
            return atlasResults.map((loc) =>
                mapToLocationResponse(buildNormalizedFromLocationDoc(loc as LocationInputObject))
            );
        }
    } catch (error) {
        if (!hasWarnedAtlasSearchFallback) {
            hasWarnedAtlasSearchFallback = true;
            logger.warn('Atlas Search unavailable for location autocomplete; falling back to Mongo prefix search', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    const normalizedRegex = new RegExp(`^${escapedNormalizedQuery}`, 'i');
    const rawPrefixRegex = new RegExp(`^${escapeRegExp(query)}`, 'i');
    const primaryResults = await Location.find({
        isActive: true,
        $or: [
            { normalizedName: normalizedRegex },
            { name: rawPrefixRegex },
            { aliases: rawPrefixRegex }
        ]
    })
        .select('name city state country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .limit(LOCATION_AUTOCOMPLETE_LIMIT)
        .lean();

    let results = primaryResults;
    if (results.length < LOCATION_AUTOCOMPLETE_LIMIT) {
        const aliasRegex = rawPrefixRegex;
        const aliasResults = await Location.find({
            isActive: true,
            aliases: aliasRegex,
            _id: { $nin: results.map((item) => item._id) }
        })
            .select('name city state country level coordinates isPopular isActive verificationStatus parentId path')
            .sort({ isPopular: -1, priority: -1, name: 1 })
            .limit(LOCATION_AUTOCOMPLETE_LIMIT - results.length)
            .lean();
        results = [...results, ...aliasResults];
    }

    const mapped = results
        .slice(0, LOCATION_AUTOCOMPLETE_LIMIT)
        .map((loc) => mapToLocationResponse(buildNormalizedFromLocationDoc(loc as LocationInputObject)));

    // If no results and query is a 6-digit Indian pincode, try Nominatim
    if (mapped.length === 0 && /^\d{6}$/.test(query)) {
        const nominatimResult = await lookupPincodeViaNominatim(query);
        if (nominatimResult) return [nominatimResult];
    }

    return mapped;
};

export const getPopularLocations = async (): Promise<NormalizedLocationResponse[]> => {
    const popularLocations = await Location.find({
        isActive: true,
        isPopular: true,
        level: 'city'
    })
        .select('name city state country level coordinates isPopular isActive verificationStatus')
        .sort({ priority: -1, name: 1 })
        .limit(12)
        .lean();

    return popularLocations.map((loc) =>
        mapToLocationResponse(buildNormalizedFromLocationDoc(loc as LocationInputObject))
    );
};

export const getStateLocations = async (): Promise<NormalizedLocationResponse[]> => {
    // Sprint 3: query by level='state' directly — no longer uses deprecated state field
    const stateAnchors = await Location.find({
        isActive: true,
        level: 'state',
    })
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();

    return stateAnchors.map((loc) =>
        mapToLocationResponse(buildNormalizedFromLocationDoc(loc as LocationInputObject))
    );
};

export const getCitiesByStateId = async (
    stateId: string
): Promise<NormalizedLocationResponse[]> => {
    if (!mongoose.Types.ObjectId.isValid(stateId)) {
        throw new AppError('Invalid stateId', 400, 'INVALID_LOCATION_ID');
    }

    const stateAnchorDoc = await Location.findById(new mongoose.Types.ObjectId(stateId))
        .select('_id name level country')
        .lean<{ _id: mongoose.Types.ObjectId; name?: string; level?: string; country?: string } | null>();

    if (!stateAnchorDoc) return [];

    // Sprint 3: query entirely via parentId/path hierarchy — no deprecated city/state fields
    const cities = await Location.find({
        isActive: true,
        level: 'city',
        $or: [
            { parentId: stateAnchorDoc._id },
            { path: stateAnchorDoc._id }
        ]
    })
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();

    return cities.map((city) =>
        mapToLocationResponse(buildNormalizedFromLocationDoc(city as LocationInputObject))
    );
};

export const getAreasByCityId = async (
    cityId: string
): Promise<NormalizedLocationResponse[]> => {
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
        throw new AppError('Invalid cityId', 400, 'INVALID_LOCATION_ID');
    }

    const cityAnchorDoc = await Location.findById(new mongoose.Types.ObjectId(cityId))
        .select('_id name level country')
        .lean<{ _id: mongoose.Types.ObjectId; name?: string; level?: string; country?: string } | null>();

    if (!cityAnchorDoc) return [];

    // Sprint 3: query entirely via parentId/path hierarchy — no deprecated city/state fields
    const areas = await Location.find({
        isActive: true,
        level: 'area',
        $or: [
            { parentId: cityAnchorDoc._id },
            { path: cityAnchorDoc._id }
        ]
    })
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();

    return areas.map((area) =>
        mapToLocationResponse(buildNormalizedFromLocationDoc(area as LocationInputObject))
    );
};

export const getNearbyLocations = async (
    lat: number,
    lng: number,
    radiusKm: number
): Promise<NormalizedLocationResponse[]> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new AppError('Invalid coordinates', 400, 'INVALID_COORDINATES');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new AppError('Coordinates out of range', 400, 'INVALID_COORDINATES');
    }
    if (lat === 0 && lng === 0) {
        throw new AppError('Null-island coordinates are not allowed', 400, 'INVALID_COORDINATES');
    }

    const safeRadiusKm = Math.min(Math.max(Number(radiusKm) || 10, 1), 500);
    const nearby = await Location.find({
        isActive: true,
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: safeRadiusKm * 1000
            }
        }
    })
        .select('name city state country level coordinates isPopular isActive verificationStatus')
        .limit(50)
        .lean();

    return nearby.map((loc) => mapToLocationResponse(buildNormalizedFromLocationDoc(loc as LocationInputObject)));
};

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

    if (boundaries.length === 0) return null;

    const boundary = [...boundaries].sort(
        (a, b) => (REVERSE_GEOCODE_LEVEL_PRIORITY[b.level] || 0) - (REVERSE_GEOCODE_LEVEL_PRIORITY[a.level] || 0)
    )[0];

    const location = await getActiveLocationById(boundary?.locationId);
    if (!location) return null;

    return mapToLocationResponse(buildNormalizedFromLocationDoc(location as LocationInputObject));
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

    const nearest = await Location.findOne({
        isActive: true,
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: 2000,  // 2km — check nearby locations for reverse geocoding
            }
        }
    })
        .select('name city state country level coordinates isPopular isActive verificationStatus')
        .lean();

    if (!nearest) return null;

    const response = mapToLocationResponse(buildNormalizedFromLocationDoc(nearest as LocationInputObject));
    await setCache(cacheKey, response, CACHE_TTLS.REVERSE_GEOCODE);
    return response;
};
export const getHierarchy = async (
    parentId?: string,
    level?: string,
    state?: string
): Promise<NormalizedLocationResponse[]> => {
    const query: Record<string, unknown> = { isActive: true };
    const normalizedLevel = normalizeLocationLevel(level);
    if (normalizedLevel) {
        query.level = normalizedLevel;
    }

    const normalizedState = toTitleCase(asString(state) || '');
    if (normalizedState) {
        query.state = new RegExp(`^${escapeRegExp(normalizedState)}$`, 'i');
    }

    if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
        if (normalizedLevel) {
            const hierarchyByPath = await Location.find({
                isActive: true,
                level: normalizedLevel,
                path: new mongoose.Types.ObjectId(parentId)
            })
                .select('name city state country level coordinates isPopular isActive verificationStatus')
                .sort({ isPopular: -1, priority: -1, name: 1 })
                .limit(200)
                .lean();

            if (hierarchyByPath.length > 0) {
                return hierarchyByPath.map((loc) =>
                    mapToLocationResponse(buildNormalizedFromLocationDoc(loc as LocationInputObject))
                );
            }
        }

        const parent = await Location.findById(parentId)
            .select('city state country level isActive')
            .lean<{
                city?: string;
                state?: string;
                country?: string;
                level?: string;
                isActive?: boolean;
            } | null>();

        if (parent && parent.isActive) {
            const parentLevel = normalizeLocationLevel(parent.level);
            if (parentLevel === 'country' && parent.country) {
                query.country = new RegExp(`^${escapeRegExp(parent.country)}$`, 'i');
            }
            if (parentLevel === 'state' && parent.state) {
                query.state = new RegExp(`^${escapeRegExp(parent.state)}$`, 'i');
            }
            if (parentLevel === 'district' && parent.state) {
                query.state = new RegExp(`^${escapeRegExp(parent.state)}$`, 'i');
            }
            if (parentLevel === 'city' && parent.city) {
                query.city = new RegExp(`^${escapeRegExp(parent.city)}$`, 'i');
            }
            if ((parentLevel === 'area' || parentLevel === 'village') && parent.city) {
                query.city = new RegExp(`^${escapeRegExp(parent.city)}$`, 'i');
            }
        }
    }

    const hierarchyItems = await Location.find(query)
        .select('name city state country level coordinates isPopular isActive verificationStatus')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .limit(200)
        .lean();

    return hierarchyItems.map((loc) => mapToLocationResponse(buildNormalizedFromLocationDoc(loc as LocationInputObject)));
};

export const getDefaultCenterLocation = async (
    configuredCenter?: { lat?: number; lng?: number }
): Promise<(NormalizedLocationResponse & { source: 'default' }) | null> => {
    const configuredLat = Number(configuredCenter?.lat);
    const configuredLng = Number(configuredCenter?.lng);
    const hasConfiguredCenter =
        Number.isFinite(configuredLat) &&
        Number.isFinite(configuredLng) &&
        (configuredLat !== 0 || configuredLng !== 0);

    if (hasConfiguredCenter) {
        const nearest = await Location.findOne({
            isActive: true,
            coordinates: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [configuredLng, configuredLat] },
                    $maxDistance: 250000,
                },
            },
        })
            .select('name city state country level coordinates isPopular isActive verificationStatus')
            .lean();

        if (nearest) {
            return {
                ...mapToLocationResponse(buildNormalizedFromLocationDoc(nearest as LocationInputObject)),
                source: 'default',
            };
        }

        return {
            ...formatLocationResponse({
                name: 'Default Center',
                display: 'Default Center',
                city: 'Default Center',
                state: '',
                country: 'Unknown',
                level: 'city',
                coordinates: {
                    type: 'Point',
                    coordinates: [configuredLng, configuredLat],
                },
            }),
            source: 'default',
        };
    }

    const fallbackLocation = await Location.findOne({ isActive: true, level: 'city', isPopular: true })
        .select('name city state country level coordinates isPopular isActive verificationStatus')
        .sort({ priority: -1, name: 1 })
        .lean();

    if (fallbackLocation) {
        return {
            ...mapToLocationResponse(buildNormalizedFromLocationDoc(fallbackLocation as LocationInputObject)),
            source: 'default',
        };
    }

    const anyActiveLocation = await Location.findOne({ isActive: true, level: 'city' })
        .select('name city state country level coordinates isPopular isActive verificationStatus')
        .sort({ priority: -1, name: 1 })
        .lean();

    if (anyActiveLocation) {
        return {
            ...mapToLocationResponse(buildNormalizedFromLocationDoc(anyActiveLocation as LocationInputObject)),
            source: 'default',
        };
    }

    return null;
};
