"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicCanonicalLocationById = exports.getActiveLocationById = exports.buildReverseGeocodeCacheKey = exports.roundCacheCoord = exports.toLocationObjectId = exports.resolveLocationFromDb = exports.mapLocationDocsToResponses = exports.buildCanonicalDisplay = exports.buildNormalizedFromLocationDoc = exports.normalizeLocationResponse = exports.mapToLocationResponse = exports.withPublicCanonicalLocationFilter = exports.SEARCH_RESULT_LEVEL_PRIORITY = exports.ATLAS_LOCATION_SEARCH_INDEX = exports.LOCATION_AUTOCOMPLETE_LIMIT = exports.REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS = exports.REVERSE_GEOCODE_REGIONAL_LEVELS = exports.REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS = exports.REVERSE_GEOCODE_SETTLEMENT_LEVELS = exports.REVERSE_GEOCODE_LEVEL_PRIORITY = exports.PUBLIC_CANONICAL_LOCATION_FILTER = exports.VERIFIED_LOCATION_STATUS = exports.HOT_ZONE_ADS_THRESHOLD = exports.HOT_ZONE_SEARCH_THRESHOLD = exports.LOCATION_POPULARITY_WEIGHTS = exports.normalizeCoordinates = exports.toGeoPoint = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("@core/config/env");
const Location_1 = __importDefault(require("@core/models/Location"));
const stringUtils_1 = require("@core/utils/stringUtils");
const _shared_1 = require("@shared");
Object.defineProperty(exports, "toGeoPoint", { enumerable: true, get: function () { return _shared_1.toGeoPoint; } });
const redisCache_1 = require("@core/utils/redisCache");
const AppError_1 = require("@core/utils/AppError");
const locationHierarchy_1 = require("@core/utils/locationHierarchy");
const LocationService_helpers_1 = require("../LocationService.helpers");
Object.defineProperty(exports, "normalizeCoordinates", { enumerable: true, get: function () { return LocationService_helpers_1.normalizeCoordinates; } });
const locationInputNormalizer_1 = require("@core/utils/locationInputNormalizer");
const formatLocation_1 = require("@core/lib/location/formatLocation");
exports.LOCATION_POPULARITY_WEIGHTS = {
    adsCount: 0.3,
    searchCount: 0.2,
    viewCount: 0.2
};
exports.HOT_ZONE_SEARCH_THRESHOLD = 100;
exports.HOT_ZONE_ADS_THRESHOLD = 50;
exports.VERIFIED_LOCATION_STATUS = 'verified';
exports.PUBLIC_CANONICAL_LOCATION_FILTER = {
    isActive: true,
    // Legacy canonical master-data rows were imported before verificationStatus
    // existed. Treat missing status as public/verified until data is backfilled.
    // Also include 'pending' status so auto-detection works for newly added cities.
    verificationStatus: { $in: [exports.VERIFIED_LOCATION_STATUS, 'pending', null] },
};
exports.REVERSE_GEOCODE_LEVEL_PRIORITY = {
    country: 1,
    state: 2,
    district: 3,
    city: 4,
    area: 5,
    village: 6
};
exports.REVERSE_GEOCODE_SETTLEMENT_LEVELS = ['area', 'village', 'city', 'district'];
exports.REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS = 50_000;
exports.REVERSE_GEOCODE_REGIONAL_LEVELS = ['state', 'country'];
exports.REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS = 250_000;
exports.LOCATION_AUTOCOMPLETE_LIMIT = 10;
exports.ATLAS_LOCATION_SEARCH_INDEX = env_1.env.ATLAS_LOCATION_SEARCH_INDEX;
exports.SEARCH_RESULT_LEVEL_PRIORITY = {
    city: 1,
    district: 2,
    area: 3,
    village: 4,
    state: 5,
    country: 6
};
const withPublicCanonicalLocationFilter = (query) => ({
    ...exports.PUBLIC_CANONICAL_LOCATION_FILTER,
    ...query,
});
exports.withPublicCanonicalLocationFilter = withPublicCanonicalLocationFilter;
/**
 * Maps a NormalizedLocation (internal) to a NormalizedLocationResponse (API).
 * Ensures flat latitude/longitude are strictly derived from coordinates.
 */
const mapToLocationResponse = (normalized) => {
    return (0, formatLocation_1.formatLocationResponse)({
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
exports.mapToLocationResponse = mapToLocationResponse;
const normalizeLocationResponse = (input) => {
    const normalizedInput = (0, LocationService_helpers_1.coerceLocationInput)(input);
    if (!normalizedInput || Object.keys(normalizedInput).length === 0)
        return null;
    // Use buildNormalizedFromLocationDoc to get the internal shape (sync)
    const internal = (0, exports.buildNormalizedFromLocationDoc)(normalizedInput);
    // Ensure we pick up any loose address/pincode from input that buildNormalized might skip
    internal.address = (0, LocationService_helpers_1.asString)(normalizedInput.address) || (0, LocationService_helpers_1.asString)(normalizedInput.formattedAddress) || internal.address;
    internal.pincode = (0, LocationService_helpers_1.asString)(normalizedInput.pincode) || internal.pincode;
    return (0, exports.mapToLocationResponse)(internal);
};
exports.normalizeLocationResponse = normalizeLocationResponse;
const buildNormalizedFromLocationDoc = (loc) => {
    const coords = (0, LocationService_helpers_1.normalizeCoordinates)(loc?.coordinates);
    // city/state flat fields removed from schema (Sprint 3). Derive from name + level.
    const city = (0, stringUtils_1.toTitleCase)((0, LocationService_helpers_1.asString)(loc?.name) || '');
    const state = (0, stringUtils_1.toTitleCase)((0, LocationService_helpers_1.asString)(loc?.state) || (0, LocationService_helpers_1.asString)(loc?.country) || '');
    const country = (0, stringUtils_1.toTitleCase)((0, LocationService_helpers_1.asString)(loc?.country) || '');
    const fallbackDisplay = (0, LocationService_helpers_1.asString)(loc?.name) || (0, LocationService_helpers_1.asString)(loc?.display);
    const rawId = (0, LocationService_helpers_1.asString)(loc?._id);
    const locationId = rawId && mongoose_1.default.Types.ObjectId.isValid(rawId)
        ? new mongoose_1.default.Types.ObjectId(rawId)
        : undefined;
    return {
        id: rawId,
        locationId,
        parentId: (0, LocationService_helpers_1.asString)(loc.parentId) || null,
        path: Array.isArray(loc.path)
            ? loc.path
                .map((entry) => (0, LocationService_helpers_1.asString)(entry))
                .filter((entry) => Boolean(entry))
            : undefined,
        name: (0, LocationService_helpers_1.asString)(loc?.name) || city,
        city,
        state,
        country,
        level: (0, LocationService_helpers_1.asString)(loc?.level) || undefined,
        display: (0, LocationService_helpers_1.buildDisplay)(city, state, fallbackDisplay),
        coordinates: coords,
        isActive: loc.isActive !== undefined ? Boolean(loc.isActive) : true,
        verificationStatus: (0, LocationService_helpers_1.asString)(loc.verificationStatus) || 'pending',
    };
};
exports.buildNormalizedFromLocationDoc = buildNormalizedFromLocationDoc;
const buildCanonicalDisplay = ({ level, name, city, state, fallbackDisplay, }) => {
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
exports.buildCanonicalDisplay = buildCanonicalDisplay;
const mapLocationDocsToResponses = async (docs) => {
    if (docs.length === 0)
        return [];
    const hierarchyMap = await (0, locationHierarchy_1.loadHierarchyMapForLocations)(docs);
    return docs.map((loc) => {
        const normalized = (0, exports.buildNormalizedFromLocationDoc)(loc);
        const summary = (0, locationHierarchy_1.buildLocationSummary)(loc, hierarchyMap);
        const resolvedName = (0, LocationService_helpers_1.asString)(loc?.name) || normalized.name || summary.name || summary.city || '';
        const resolvedCity = normalized.level === 'state' || normalized.level === 'country'
            ? normalized.city
            : summary.city || normalized.city;
        const resolvedState = summary.state || normalized.state;
        const resolvedCountry = summary.country || normalized.country;
        return (0, exports.mapToLocationResponse)({
            ...normalized,
            name: resolvedName,
            city: resolvedCity,
            state: resolvedState,
            country: resolvedCountry,
            display: (0, exports.buildCanonicalDisplay)({
                level: normalized.level,
                name: resolvedName,
                city: resolvedCity,
                state: resolvedState,
                fallbackDisplay: (0, LocationService_helpers_1.asString)(loc?.display) || normalized.display,
            }),
        });
    });
};
exports.mapLocationDocsToResponses = mapLocationDocsToResponses;
const resolveLocationFromDb = async (input) => {
    const normalized = (0, LocationService_helpers_1.coerceLocationInput)(input);
    const rawLocationId = (0, LocationService_helpers_1.extractObjectIdString)(normalized);
    if (rawLocationId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(rawLocationId)) {
            throw new AppError_1.AppError('Invalid location ID format', 400, 'INVALID_LOCATION_ID');
        }
        const loc = await Location_1.default.findOne({ _id: rawLocationId, isActive: true }).lean();
        if (!loc) {
            throw new AppError_1.AppError('Invalid or inactive location', 404, 'LOCATION_NOT_FOUND');
        }
        return (0, exports.buildNormalizedFromLocationDoc)(loc);
    }
    const cityCandidate = (0, LocationService_helpers_1.asString)(normalized.city) ||
        (0, LocationService_helpers_1.asString)(normalized.name) ||
        (0, LocationService_helpers_1.asString)(normalized.display) ||
        (0, LocationService_helpers_1.asString)(normalized.formattedAddress);
    if (!cityCandidate)
        return null;
    const normalizedCityCandidate = (0, locationInputNormalizer_1.normalizeLocationNameForSearch)(cityCandidate);
    const cityRegex = new RegExp(`^${cityCandidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    // city/state flat fields removed in Sprint 3 — query by name + level
    const loc = await Location_1.default.findOne({
        isActive: true,
        $or: [
            { normalizedName: normalizedCityCandidate },
            { name: cityRegex }
        ],
    })
        .sort({ priority: -1, createdAt: 1 })
        .lean();
    if (!loc)
        return null;
    return (0, exports.buildNormalizedFromLocationDoc)(loc);
};
exports.resolveLocationFromDb = resolveLocationFromDb;
/**
 * Resolves and normalizes location data from various input formats.
 * Master logic for coordinate flipping [lng, lat] -> {lat, lng}
 */
const toLocationObjectId = (locationId) => {
    const value = (0, LocationService_helpers_1.asString)(locationId);
    if (!value || !mongoose_1.default.Types.ObjectId.isValid(value)) {
        return null;
    }
    return new mongoose_1.default.Types.ObjectId(value);
};
exports.toLocationObjectId = toLocationObjectId;
const roundCacheCoord = (value) => Number(value.toFixed(3)).toString();
exports.roundCacheCoord = roundCacheCoord;
const buildReverseGeocodeCacheKey = (lat, lng) => redisCache_1.CACHE_KEYS.reverseGeocode((0, exports.roundCacheCoord)(lat), (0, exports.roundCacheCoord)(lng));
exports.buildReverseGeocodeCacheKey = buildReverseGeocodeCacheKey;
const getActiveLocationById = async (locationId) => {
    const objectId = (0, exports.toLocationObjectId)(locationId);
    if (!objectId)
        return null;
    return Location_1.default.findOne({ _id: objectId, isActive: true })
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .lean();
};
exports.getActiveLocationById = getActiveLocationById;
const getPublicCanonicalLocationById = async (locationId) => {
    const objectId = (0, exports.toLocationObjectId)(locationId);
    if (!objectId)
        return null;
    return Location_1.default.findOne((0, exports.withPublicCanonicalLocationFilter)({ _id: objectId }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .lean();
};
exports.getPublicCanonicalLocationById = getPublicCanonicalLocationById;
//# sourceMappingURL=hierarchyLoader.js.map