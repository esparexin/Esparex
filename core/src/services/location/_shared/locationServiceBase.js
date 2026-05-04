"use strict";
/**
 * locationServiceBase.ts
 * Shared re-export barrel for all Location sub-services.
 * Eliminates the identical 63-line import block duplicated across
 * LocationNormalizer, LocationSearchService, LocationHierarchyService,
 * LocationAnalyticsService, and ReverseGeocodeService.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveLocationById = exports.buildReverseGeocodeCacheKey = exports.roundCacheCoord = exports.toLocationObjectId = exports.resolveLocationFromDb = exports.normalizeLocationResponse = exports.mapToLocationResponse = exports.mapLocationDocsToResponses = exports.buildCanonicalDisplay = exports.buildNormalizedFromLocationDoc = exports.withPublicCanonicalLocationFilter = exports.SEARCH_RESULT_LEVEL_PRIORITY = exports.ATLAS_LOCATION_SEARCH_INDEX = exports.LOCATION_AUTOCOMPLETE_LIMIT = exports.REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS = exports.REVERSE_GEOCODE_REGIONAL_LEVELS = exports.REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS = exports.REVERSE_GEOCODE_SETTLEMENT_LEVELS = exports.REVERSE_GEOCODE_LEVEL_PRIORITY = exports.PUBLIC_CANONICAL_LOCATION_FILTER = exports.VERIFIED_LOCATION_STATUS = exports.HOT_ZONE_ADS_THRESHOLD = exports.HOT_ZONE_SEARCH_THRESHOLD = exports.LOCATION_POPULARITY_WEIGHTS = exports.normalizeLocationNameForSearch = exports.normalizeLocationLevel = exports.normalizeLocationInput = exports.normalizeCoordinates = exports.extractObjectIdString = exports.equalsIgnoreCase = exports.coerceLocationInput = exports.buildDisplay = exports.asString = exports.loadHierarchyMapForLocations = exports.buildLocationSummary = exports.AppError = exports.setCache = exports.getCache = exports.CACHE_TTLS = exports.CACHE_KEYS = exports.toGeoPoint = exports.formatLocationResponse = exports.toTitleCase = exports.escapeRegExp = exports.logger = exports.LocationAnalytics = exports.AdminBoundary = exports.Location = exports.https = exports.mongoose = void 0;
exports.getPublicCanonicalLocationById = void 0;
var mongoose_1 = require("mongoose");
Object.defineProperty(exports, "mongoose", { enumerable: true, get: function () { return __importDefault(mongoose_1).default; } });
var https_1 = require("https");
Object.defineProperty(exports, "https", { enumerable: true, get: function () { return __importDefault(https_1).default; } });
var Location_1 = require("@core/models/Location");
Object.defineProperty(exports, "Location", { enumerable: true, get: function () { return __importDefault(Location_1).default; } });
var AdminBoundary_1 = require("@core/models/AdminBoundary");
Object.defineProperty(exports, "AdminBoundary", { enumerable: true, get: function () { return __importDefault(AdminBoundary_1).default; } });
var LocationAnalytics_1 = require("@core/models/LocationAnalytics");
Object.defineProperty(exports, "LocationAnalytics", { enumerable: true, get: function () { return __importDefault(LocationAnalytics_1).default; } });
var logger_1 = require("@core/utils/logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return __importDefault(logger_1).default; } });
var stringUtils_1 = require("@core/utils/stringUtils");
Object.defineProperty(exports, "escapeRegExp", { enumerable: true, get: function () { return stringUtils_1.escapeRegExp; } });
Object.defineProperty(exports, "toTitleCase", { enumerable: true, get: function () { return stringUtils_1.toTitleCase; } });
var formatLocation_1 = require("../../../lib/location/formatLocation");
Object.defineProperty(exports, "formatLocationResponse", { enumerable: true, get: function () { return formatLocation_1.formatLocationResponse; } });
var _shared_1 = require("@shared");
Object.defineProperty(exports, "toGeoPoint", { enumerable: true, get: function () { return _shared_1.toGeoPoint; } });
var redisCache_1 = require("@core/utils/redisCache");
Object.defineProperty(exports, "CACHE_KEYS", { enumerable: true, get: function () { return redisCache_1.CACHE_KEYS; } });
Object.defineProperty(exports, "CACHE_TTLS", { enumerable: true, get: function () { return redisCache_1.CACHE_TTLS; } });
Object.defineProperty(exports, "getCache", { enumerable: true, get: function () { return redisCache_1.getCache; } });
Object.defineProperty(exports, "setCache", { enumerable: true, get: function () { return redisCache_1.setCache; } });
var AppError_1 = require("@core/utils/AppError");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return AppError_1.AppError; } });
var locationHierarchy_1 = require("@core/utils/locationHierarchy");
Object.defineProperty(exports, "buildLocationSummary", { enumerable: true, get: function () { return locationHierarchy_1.buildLocationSummary; } });
Object.defineProperty(exports, "loadHierarchyMapForLocations", { enumerable: true, get: function () { return locationHierarchy_1.loadHierarchyMapForLocations; } });
var LocationService_helpers_1 = require("../LocationService.helpers");
Object.defineProperty(exports, "asString", { enumerable: true, get: function () { return LocationService_helpers_1.asString; } });
Object.defineProperty(exports, "buildDisplay", { enumerable: true, get: function () { return LocationService_helpers_1.buildDisplay; } });
Object.defineProperty(exports, "coerceLocationInput", { enumerable: true, get: function () { return LocationService_helpers_1.coerceLocationInput; } });
Object.defineProperty(exports, "equalsIgnoreCase", { enumerable: true, get: function () { return LocationService_helpers_1.equalsIgnoreCase; } });
Object.defineProperty(exports, "extractObjectIdString", { enumerable: true, get: function () { return LocationService_helpers_1.extractObjectIdString; } });
Object.defineProperty(exports, "normalizeCoordinates", { enumerable: true, get: function () { return LocationService_helpers_1.normalizeCoordinates; } });
var locationInputNormalizer_1 = require("@core/utils/locationInputNormalizer");
Object.defineProperty(exports, "normalizeLocationInput", { enumerable: true, get: function () { return locationInputNormalizer_1.normalizeLocationInput; } });
Object.defineProperty(exports, "normalizeLocationLevel", { enumerable: true, get: function () { return locationInputNormalizer_1.normalizeLocationLevel; } });
Object.defineProperty(exports, "normalizeLocationNameForSearch", { enumerable: true, get: function () { return locationInputNormalizer_1.normalizeLocationNameForSearch; } });
var hierarchyLoader_1 = require("./hierarchyLoader");
Object.defineProperty(exports, "LOCATION_POPULARITY_WEIGHTS", { enumerable: true, get: function () { return hierarchyLoader_1.LOCATION_POPULARITY_WEIGHTS; } });
Object.defineProperty(exports, "HOT_ZONE_SEARCH_THRESHOLD", { enumerable: true, get: function () { return hierarchyLoader_1.HOT_ZONE_SEARCH_THRESHOLD; } });
Object.defineProperty(exports, "HOT_ZONE_ADS_THRESHOLD", { enumerable: true, get: function () { return hierarchyLoader_1.HOT_ZONE_ADS_THRESHOLD; } });
Object.defineProperty(exports, "VERIFIED_LOCATION_STATUS", { enumerable: true, get: function () { return hierarchyLoader_1.VERIFIED_LOCATION_STATUS; } });
Object.defineProperty(exports, "PUBLIC_CANONICAL_LOCATION_FILTER", { enumerable: true, get: function () { return hierarchyLoader_1.PUBLIC_CANONICAL_LOCATION_FILTER; } });
Object.defineProperty(exports, "REVERSE_GEOCODE_LEVEL_PRIORITY", { enumerable: true, get: function () { return hierarchyLoader_1.REVERSE_GEOCODE_LEVEL_PRIORITY; } });
Object.defineProperty(exports, "REVERSE_GEOCODE_SETTLEMENT_LEVELS", { enumerable: true, get: function () { return hierarchyLoader_1.REVERSE_GEOCODE_SETTLEMENT_LEVELS; } });
Object.defineProperty(exports, "REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS", { enumerable: true, get: function () { return hierarchyLoader_1.REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS; } });
Object.defineProperty(exports, "REVERSE_GEOCODE_REGIONAL_LEVELS", { enumerable: true, get: function () { return hierarchyLoader_1.REVERSE_GEOCODE_REGIONAL_LEVELS; } });
Object.defineProperty(exports, "REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS", { enumerable: true, get: function () { return hierarchyLoader_1.REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS; } });
Object.defineProperty(exports, "LOCATION_AUTOCOMPLETE_LIMIT", { enumerable: true, get: function () { return hierarchyLoader_1.LOCATION_AUTOCOMPLETE_LIMIT; } });
Object.defineProperty(exports, "ATLAS_LOCATION_SEARCH_INDEX", { enumerable: true, get: function () { return hierarchyLoader_1.ATLAS_LOCATION_SEARCH_INDEX; } });
Object.defineProperty(exports, "SEARCH_RESULT_LEVEL_PRIORITY", { enumerable: true, get: function () { return hierarchyLoader_1.SEARCH_RESULT_LEVEL_PRIORITY; } });
Object.defineProperty(exports, "withPublicCanonicalLocationFilter", { enumerable: true, get: function () { return hierarchyLoader_1.withPublicCanonicalLocationFilter; } });
Object.defineProperty(exports, "buildNormalizedFromLocationDoc", { enumerable: true, get: function () { return hierarchyLoader_1.buildNormalizedFromLocationDoc; } });
Object.defineProperty(exports, "buildCanonicalDisplay", { enumerable: true, get: function () { return hierarchyLoader_1.buildCanonicalDisplay; } });
Object.defineProperty(exports, "mapLocationDocsToResponses", { enumerable: true, get: function () { return hierarchyLoader_1.mapLocationDocsToResponses; } });
Object.defineProperty(exports, "mapToLocationResponse", { enumerable: true, get: function () { return hierarchyLoader_1.mapToLocationResponse; } });
Object.defineProperty(exports, "normalizeLocationResponse", { enumerable: true, get: function () { return hierarchyLoader_1.normalizeLocationResponse; } });
Object.defineProperty(exports, "resolveLocationFromDb", { enumerable: true, get: function () { return hierarchyLoader_1.resolveLocationFromDb; } });
Object.defineProperty(exports, "toLocationObjectId", { enumerable: true, get: function () { return hierarchyLoader_1.toLocationObjectId; } });
Object.defineProperty(exports, "roundCacheCoord", { enumerable: true, get: function () { return hierarchyLoader_1.roundCacheCoord; } });
Object.defineProperty(exports, "buildReverseGeocodeCacheKey", { enumerable: true, get: function () { return hierarchyLoader_1.buildReverseGeocodeCacheKey; } });
Object.defineProperty(exports, "getActiveLocationById", { enumerable: true, get: function () { return hierarchyLoader_1.getActiveLocationById; } });
Object.defineProperty(exports, "getPublicCanonicalLocationById", { enumerable: true, get: function () { return hierarchyLoader_1.getPublicCanonicalLocationById; } });
//# sourceMappingURL=locationServiceBase.js.map