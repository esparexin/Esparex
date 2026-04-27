"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchLocations = exports.lookupLocationByPincode = exports.normalizeCoordinates = exports.toGeoPoint = void 0;
const locationServiceBase_1 = require("./_shared/locationServiceBase");
var locationServiceBase_2 = require("./_shared/locationServiceBase");
Object.defineProperty(exports, "toGeoPoint", { enumerable: true, get: function () { return locationServiceBase_2.toGeoPoint; } });
Object.defineProperty(exports, "normalizeCoordinates", { enumerable: true, get: function () { return locationServiceBase_2.normalizeCoordinates; } });
const LocationNormalizer_1 = require("./LocationNormalizer");
let hasWarnedAtlasSearchFallback = false;
const lookupPincodeViaNominatim = (pincode) => {
    return new Promise((resolve) => {
        const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode)}&country=India&format=json&limit=1&addressdetails=1`;
        const req = locationServiceBase_1.https.get(url, {
            headers: { 'User-Agent': 'EsparexAdmin/1.0 (admin-backend)' },
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk.toString(); });
            res.on('end', () => {
                try {
                    const results = JSON.parse(data);
                    const first = results[0];
                    if (!first?.address) {
                        locationServiceBase_1.logger.info('Nominatim: No address found for pincode', { pincode });
                        return resolve(null);
                    }
                    const addr = first.address;
                    const city = addr.city || addr.town || addr.village || addr.county || '';
                    const state = addr.state || '';
                    if (!city || !state) {
                        locationServiceBase_1.logger.info('Nominatim: Incomplete data (city/state missing)', { pincode, addr });
                        return resolve(null);
                    }
                    const lat = parseFloat(first.lat ?? '');
                    const lon = parseFloat(first.lon ?? '');
                    locationServiceBase_1.logger.info('Nominatim: Successfully resolved pincode', { pincode, city, state });
                    resolve((0, LocationNormalizer_1.mapToLocationResponse)({
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
                }
                catch (parseError) {
                    locationServiceBase_1.logger.error('Nominatim: Failed to parse response', {
                        pincode,
                        error: parseError instanceof Error ? parseError.message : String(parseError)
                    });
                    resolve(null);
                }
            });
        });
        req.on('error', (err) => {
            locationServiceBase_1.logger.warn('Nominatim: Request failed', {
                pincode,
                error: err.message
            });
            resolve(null);
        });
        req.on('timeout', () => {
            locationServiceBase_1.logger.warn('Nominatim: Request timed out', { pincode });
            req.destroy();
            resolve(null);
        });
    });
};
const lookupLocationByPincode = async (pincode) => {
    if (!/^\d{6}$/.test(pincode)) {
        throw new locationServiceBase_1.AppError('Valid 6-digit pincode is required', 400, 'INVALID_PINCODE');
    }
    const exactAliasRegex = new RegExp(`(^|\\b)${(0, locationServiceBase_1.escapeRegExp)(pincode)}(\\b|$)`, 'i');
    const exactCandidates = await locationServiceBase_1.Location.find((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
        $or: [
            { aliases: exactAliasRegex },
            { name: exactAliasRegex },
            { normalizedName: (0, locationServiceBase_1.normalizeLocationNameForSearch)(pincode) }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path aliases')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .limit(5)
        .lean();
    if (exactCandidates.length > 0) {
        const [bestMatch] = await (0, locationServiceBase_1.mapLocationDocsToResponses)(exactCandidates);
        if (bestMatch)
            return {
                ...bestMatch,
                pincode,
            };
    }
    return lookupPincodeViaNominatim(pincode);
};
exports.lookupLocationByPincode = lookupLocationByPincode;
const searchLocations = async (q) => {
    const query = q?.trim() || '';
    if (query.length < 2)
        return [];
    const normalizedQuery = (0, locationServiceBase_1.normalizeLocationNameForSearch)(query);
    if (!normalizedQuery)
        return [];
    const escapedNormalizedQuery = (0, locationServiceBase_1.escapeRegExp)(normalizedQuery);
    try {
        const atlasResults = await locationServiceBase_1.Location.aggregate([
            {
                $search: {
                    index: locationServiceBase_1.ATLAS_LOCATION_SEARCH_INDEX,
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
                                    value: locationServiceBase_1.VERIFIED_LOCATION_STATUS
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
                                { case: { $eq: ['$level', 'city'] }, then: locationServiceBase_1.SEARCH_RESULT_LEVEL_PRIORITY.city },
                                { case: { $eq: ['$level', 'district'] }, then: locationServiceBase_1.SEARCH_RESULT_LEVEL_PRIORITY.district },
                                { case: { $eq: ['$level', 'area'] }, then: locationServiceBase_1.SEARCH_RESULT_LEVEL_PRIORITY.area },
                                { case: { $eq: ['$level', 'village'] }, then: locationServiceBase_1.SEARCH_RESULT_LEVEL_PRIORITY.village },
                                { case: { $eq: ['$level', 'state'] }, then: locationServiceBase_1.SEARCH_RESULT_LEVEL_PRIORITY.state },
                                { case: { $eq: ['$level', 'country'] }, then: locationServiceBase_1.SEARCH_RESULT_LEVEL_PRIORITY.country }
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
            { $limit: locationServiceBase_1.LOCATION_AUTOCOMPLETE_LIMIT }
        ]);
        if (atlasResults.length > 0) {
            return (0, locationServiceBase_1.mapLocationDocsToResponses)(atlasResults);
        }
    }
    catch (error) {
        if (!hasWarnedAtlasSearchFallback) {
            hasWarnedAtlasSearchFallback = true;
            locationServiceBase_1.logger.warn('Atlas Search unavailable for location autocomplete; falling back to Mongo prefix search', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    const normalizedRegex = new RegExp(`^${escapedNormalizedQuery}`, 'i');
    const rawPrefixRegex = new RegExp(`^${(0, locationServiceBase_1.escapeRegExp)(query)}`, 'i');
    const primaryResults = await locationServiceBase_1.Location.find((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
        $or: [
            { normalizedName: normalizedRegex },
            { name: rawPrefixRegex },
            { aliases: rawPrefixRegex }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path aliases')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .limit(locationServiceBase_1.LOCATION_AUTOCOMPLETE_LIMIT)
        .lean();
    let results = primaryResults;
    if (results.length < locationServiceBase_1.LOCATION_AUTOCOMPLETE_LIMIT) {
        const aliasRegex = rawPrefixRegex;
        const aliasResults = await locationServiceBase_1.Location.find((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
            aliases: aliasRegex,
            _id: { $nin: results.map((item) => item._id) }
        }))
            .select('name country level coordinates isPopular isActive verificationStatus parentId path aliases')
            .sort({ isPopular: -1, priority: -1, name: 1 })
            .limit(locationServiceBase_1.LOCATION_AUTOCOMPLETE_LIMIT - results.length)
            .lean();
        results = [...results, ...aliasResults];
    }
    const mapped = results
        .slice(0, locationServiceBase_1.LOCATION_AUTOCOMPLETE_LIMIT);
    const mappedResponses = await (0, locationServiceBase_1.mapLocationDocsToResponses)(mapped);
    // If no results and query is a 6-digit Indian pincode, try Nominatim
    if (mappedResponses.length === 0 && /^\d{6}$/.test(query)) {
        const nominatimResult = await (0, exports.lookupLocationByPincode)(query);
        if (nominatimResult)
            return [nominatimResult];
    }
    return mappedResponses;
};
exports.searchLocations = searchLocations;
//# sourceMappingURL=LocationSearchService.js.map