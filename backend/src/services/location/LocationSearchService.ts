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
import { normalizeLocation, normalizeLocationResponse, mapToLocationResponse } from './LocationNormalizer';

let hasWarnedAtlasSearchFallback = false;

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

export const lookupLocationByPincode = async (
    pincode: string
): Promise<NormalizedLocationResponse | null> => {
    if (!/^\d{6}$/.test(pincode)) {
        throw new AppError('Valid 6-digit pincode is required', 400, 'INVALID_PINCODE');
    }

    const exactAliasRegex = new RegExp(`(^|\\b)${escapeRegExp(pincode)}(\\b|$)`, 'i');
    const exactCandidates = await Location.find(withPublicCanonicalLocationFilter({
        $or: [
            { aliases: exactAliasRegex },
            { name: exactAliasRegex },
            { normalizedName: normalizeLocationNameForSearch(pincode) }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path aliases')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .limit(5)
        .lean();

    if (exactCandidates.length > 0) {
        const [bestMatch] = await mapLocationDocsToResponses(exactCandidates as LocationInputObject[]);
        if (bestMatch) return {
            ...bestMatch,
            pincode,
        };
    }

    return lookupPincodeViaNominatim(pincode);
};

export const searchLocations = async (
    q: string
): Promise<NormalizedLocationResponse[]> => {
    const query = q?.trim() || '';

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
                            },
                            {
                                equals: {
                                    path: 'verificationStatus',
                                    value: VERIFIED_LOCATION_STATUS
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
            return mapLocationDocsToResponses(atlasResults as LocationInputObject[]);
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
    const primaryResults = await Location.find(withPublicCanonicalLocationFilter({
        $or: [
            { normalizedName: normalizedRegex },
            { name: rawPrefixRegex },
            { aliases: rawPrefixRegex }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path aliases')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .limit(LOCATION_AUTOCOMPLETE_LIMIT)
        .lean();

    let results = primaryResults;
    if (results.length < LOCATION_AUTOCOMPLETE_LIMIT) {
        const aliasRegex = rawPrefixRegex;
        const aliasResults = await Location.find(withPublicCanonicalLocationFilter({
            aliases: aliasRegex,
            _id: { $nin: results.map((item) => item._id) }
        }))
            .select('name country level coordinates isPopular isActive verificationStatus parentId path aliases')
            .sort({ isPopular: -1, priority: -1, name: 1 })
            .limit(LOCATION_AUTOCOMPLETE_LIMIT - results.length)
            .lean();
        results = [...results, ...aliasResults];
    }

    const mapped = results
        .slice(0, LOCATION_AUTOCOMPLETE_LIMIT);

    const mappedResponses = await mapLocationDocsToResponses(mapped as LocationInputObject[]);

    // If no results and query is a 6-digit Indian pincode, try Nominatim
    if (mappedResponses.length === 0 && /^\d{6}$/.test(query)) {
        const nominatimResult = await lookupLocationByPincode(query);
        if (nominatimResult) return [nominatimResult];
    }

    return mappedResponses;
};

