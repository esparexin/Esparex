"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRefreshLocationStats = exports.adminApproveRejectLocation = exports.adminGetModerationQueue = exports.adminDeleteGeofence = exports.adminUpdateGeofence = exports.adminCreateGeofence = exports.adminGetGeofences = exports.adminDeleteLocation = exports.adminToggleLocationStatus = exports.adminUpdateLocation = exports.adminCreateLocation = exports.adminGetAllLocations = exports.adminReverseGeocode = exports.adminGetDistinctStates = exports.adminCreateAreaLocation = exports.adminCreateCityLocation = exports.adminCreateStateLocation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const LocationQueryService_1 = require("./location/LocationQueryService");
const LocationMutationService_1 = require("./location/LocationMutationService");
const GeofenceService_1 = require("./location/GeofenceService");
const locationAnalyticsWorker_1 = require("../workers/locationAnalyticsWorker");
const slugify_1 = __importDefault(require("slugify"));
const stringUtils_1 = require("@core/utils/stringUtils");
const logger_1 = __importDefault(require("@core/utils/logger"));
const redisCache_1 = require("@core/utils/redisCache");
const locationStatus_1 = require("@core/constants/enums/locationStatus");
const LocationNormalizer_1 = require("./location/LocationNormalizer");
const ReverseGeocodeService_1 = require("./location/ReverseGeocodeService");
const NotificationService_1 = require("./NotificationService");
const locationHierarchy_1 = require("@core/utils/locationHierarchy");
const AppError_1 = require("@core/utils/AppError");
// --- Helpers ---
const safeSlugify = (text) => {
    return (0, slugify_1.default)(text, { lower: true, strict: true, trim: true });
};
const ADMIN_STATES_CACHE_KEY = 'admin:locations:states';
const ADMIN_STATES_CACHE_TTL_SECONDS = 300;
const toScopeQuery = (locationIds) => {
    if (locationIds === null)
        return {};
    if (locationIds.length === 0) {
        return { _id: { $in: [] } };
    }
    return {
        $or: [
            { _id: { $in: locationIds } },
            { path: { $in: locationIds } },
        ],
    };
};
const hydrateLocationResponses = async (locations) => {
    const hierarchyMap = await (0, locationHierarchy_1.loadHierarchyMapForLocations)(locations);
    return locations
        .map((location) => {
        const summary = (0, locationHierarchy_1.buildLocationSummary)(location, hierarchyMap);
        return (0, LocationNormalizer_1.normalizeLocationResponse)({
            ...location,
            name: location.name || summary.name,
            city: summary.city,
            district: summary.district,
            state: summary.state,
            country: summary.country,
        });
    })
        .filter((location) => Boolean(location));
};
const invalidateLocationStateCache = async () => {
    try {
        await Promise.all([
            (0, redisCache_1.delCache)(ADMIN_STATES_CACHE_KEY),
            (0, redisCache_1.invalidateLocationCaches)()
        ]);
    }
    catch (error) {
        logger_1.default.warn('Failed to invalidate admin location states cache', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
const parsePaginationParams = (query) => {
    const page = Math.max(1, parseInt(String(query.page ?? '1')) || 1);
    const limit = Math.max(1, Math.min(parseInt(String(query.limit ?? '20')) || 20, 100));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
const adminCreateStateLocation = async (body) => {
    const stateName = (0, locationHierarchy_1.asString)(body.name) || (0, locationHierarchy_1.asString)(body.state);
    if (!stateName) {
        throw new AppError_1.AppError('State name is required.', 400);
    }
    return (0, exports.adminCreateLocation)({
        ...body,
        name: stateName,
        level: 'state',
        parentId: null,
    });
};
exports.adminCreateStateLocation = adminCreateStateLocation;
const adminCreateCityLocation = async (body) => {
    const stateId = (0, locationHierarchy_1.asString)(body.stateId);
    const cityName = (0, locationHierarchy_1.asString)(body.name) || (0, locationHierarchy_1.asString)(body.city);
    if (!stateId)
        throw new AppError_1.AppError('stateId is required.', 400);
    if (!cityName)
        throw new AppError_1.AppError('City name is required.', 400);
    if (!mongoose_1.default.Types.ObjectId.isValid(stateId)) {
        throw new AppError_1.AppError('Invalid stateId.', 400);
    }
    const stateAnchor = await (0, LocationQueryService_1.findLocationByIdLean)(stateId, '_id name country level parentId path');
    const stateSummary = await (0, locationHierarchy_1.resolveLocationSummary)(stateAnchor);
    if (!stateSummary?.state) {
        throw new AppError_1.AppError('State not found.', 404);
    }
    return (0, exports.adminCreateLocation)({
        ...body,
        name: cityName,
        country: (0, locationHierarchy_1.asString)(body.country) || stateSummary.country || 'Unknown',
        level: 'city',
        parentId: stateId,
    });
};
exports.adminCreateCityLocation = adminCreateCityLocation;
const adminCreateAreaLocation = async (body) => {
    const cityId = (0, locationHierarchy_1.asString)(body.cityId);
    const areaName = (0, locationHierarchy_1.asString)(body.name) || (0, locationHierarchy_1.asString)(body.area);
    if (!cityId)
        throw new AppError_1.AppError('cityId is required.', 400);
    if (!areaName)
        throw new AppError_1.AppError('Area name is required.', 400);
    if (!mongoose_1.default.Types.ObjectId.isValid(cityId)) {
        throw new AppError_1.AppError('Invalid cityId.', 400);
    }
    const cityAnchor = await (0, LocationQueryService_1.findLocationByIdLean)(cityId, '_id name country level parentId path');
    const citySummary = await (0, locationHierarchy_1.resolveLocationSummary)(cityAnchor);
    if (!citySummary?.city || !citySummary?.state) {
        throw new AppError_1.AppError('City not found.', 404);
    }
    return (0, exports.adminCreateLocation)({
        ...body,
        name: areaName,
        country: (0, locationHierarchy_1.asString)(body.country) || citySummary.country || 'Unknown',
        level: 'area',
        parentId: cityId,
    });
};
exports.adminCreateAreaLocation = adminCreateAreaLocation;
const adminGetDistinctStates = async () => {
    const cachedStates = await (0, redisCache_1.getCache)(ADMIN_STATES_CACHE_KEY);
    if (Array.isArray(cachedStates)) {
        return cachedStates;
    }
    const states = await (0, LocationQueryService_1.getDistinctStateLocations)();
    const sorted = states
        .map((entry) => (0, locationHierarchy_1.asString)(entry.name))
        .filter((value) => Boolean(value))
        .sort((a, b) => a.localeCompare(b));
    await (0, redisCache_1.setCache)(ADMIN_STATES_CACHE_KEY, sorted, ADMIN_STATES_CACHE_TTL_SECONDS);
    return sorted;
};
exports.adminGetDistinctStates = adminGetDistinctStates;
const adminReverseGeocode = async (latRaw, lngRaw) => {
    const lat = parseFloat(latRaw);
    const lng = parseFloat(lngRaw);
    if (isNaN(lat) || isNaN(lng)) {
        throw new AppError_1.AppError('Coordinates (lat, lng) are required.', 400);
    }
    return (0, ReverseGeocodeService_1.reverseGeocode)(lat, lng);
};
exports.adminReverseGeocode = adminReverseGeocode;
const adminGetAllLocations = async (query) => {
    const { page, limit, skip } = parsePaginationParams(query);
    const search = typeof query.q === 'string' ? query.q.trim() : undefined;
    const status = typeof query.status === 'string' ? query.status : undefined;
    const state = typeof query.state === 'string' ? query.state : undefined;
    const level = typeof query.level === 'string' ? query.level : undefined;
    const dbQuery = {};
    if (status === 'active')
        dbQuery.isActive = true;
    if (status === 'inactive')
        dbQuery.isActive = false;
    if (level && level !== 'all')
        dbQuery.level = level;
    if (search) {
        const escaped = (0, stringUtils_1.escapeRegExp)(search);
        dbQuery.$or = [
            { name: { $regex: escaped, $options: 'i' } },
            { normalizedName: { $regex: escaped, $options: 'i' } },
            { slug: { $regex: escaped, $options: 'i' } },
            { aliases: { $regex: escaped, $options: 'i' } },
        ];
    }
    const scope = state && state !== 'all'
        ? await (0, locationHierarchy_1.resolveLocationScope)({ state })
        : { locationIds: null };
    Object.assign(dbQuery, toScopeQuery(scope.locationIds));
    const { locations, total } = await (0, LocationQueryService_1.getLocationsPaginated)(dbQuery, skip, limit);
    const items = await hydrateLocationResponses(locations);
    return { items, total, page, limit };
};
exports.adminGetAllLocations = adminGetAllLocations;
const adminCreateLocation = async (createBody) => {
    const { country, latitude, longitude, isActive, level, name } = createBody;
    const coords = (0, LocationNormalizer_1.normalizeCoordinates)({ lat: latitude, lng: longitude });
    if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) {
        throw new AppError_1.AppError('Valid map coordinates are required.', 400);
    }
    const displayName = (0, locationHierarchy_1.asString)(name);
    if (!displayName) {
        throw new AppError_1.AppError('Location name is required.', 400);
    }
    const requestedLevel = (0, locationHierarchy_1.asString)(level)?.toLowerCase();
    const finalLevel = requestedLevel === 'country' ||
        requestedLevel === 'state' ||
        requestedLevel === 'district' ||
        requestedLevel === 'city' ||
        requestedLevel === 'area' ||
        requestedLevel === 'village'
        ? requestedLevel
        : 'city';
    const explicitParentId = (0, locationHierarchy_1.asString)(createBody.parentId);
    let parentLocation = null;
    if (explicitParentId) {
        if (!/^[a-f\d]{24}$/i.test(explicitParentId)) {
            throw new AppError_1.AppError('Invalid parentId.', 400);
        }
        parentLocation = await (0, LocationQueryService_1.findActiveParentById)(explicitParentId);
        if (!parentLocation) {
            throw new AppError_1.AppError('Parent location not found.', 404);
        }
    }
    else {
        parentLocation = await (0, locationHierarchy_1.resolveParentLocation)({
            level: finalLevel,
            country: (0, locationHierarchy_1.asString)(country) || 'Unknown',
            state: (0, locationHierarchy_1.asString)(createBody.state),
            district: (0, locationHierarchy_1.asString)(createBody.district),
            city: (0, locationHierarchy_1.asString)(createBody.city) || displayName
        });
    }
    const parentSummary = parentLocation
        ? await (0, locationHierarchy_1.resolveLocationSummary)(parentLocation)
        : null;
    const normalizedCountry = (0, locationHierarchy_1.asString)(country) || parentSummary?.country || 'Unknown';
    const slug = safeSlugify([displayName, parentSummary?.state, normalizedCountry]
        .filter((part) => Boolean(part))
        .join('-'));
    const existing = await (0, LocationQueryService_1.findDuplicateLocation)(displayName, normalizedCountry, finalLevel, parentLocation?._id);
    if (existing) {
        throw new AppError_1.AppError('Location already exists in this state.', 400);
    }
    const locationId = (0, LocationMutationService_1.generateLocationId)();
    const location = await (0, LocationMutationService_1.createLocationRecord)({
        _id: locationId,
        name: displayName,
        country: normalizedCountry,
        coordinates: coords,
        level: finalLevel,
        parentId: parentLocation?._id || null,
        path: (0, locationHierarchy_1.buildHierarchyPath)(locationId, parentLocation),
        slug,
        isActive: isActive !== undefined ? isActive : true,
        priority: 0
    });
    await invalidateLocationStateCache();
    const [response] = await hydrateLocationResponses([location.toObject()]);
    return response;
};
exports.adminCreateLocation = adminCreateLocation;
const adminUpdateLocation = async (id, updateBody) => {
    const { country, latitude, longitude, isActive, level, name } = updateBody;
    const nextCountry = (0, locationHierarchy_1.asString)(country);
    const nextName = (0, locationHierarchy_1.asString)(name);
    const location = await (0, LocationQueryService_1.findLocationById)(id);
    if (!location) {
        throw new AppError_1.AppError('Location not found', 404);
    }
    if (level) {
        const normalizedLevel = (0, locationHierarchy_1.asString)(level)?.toLowerCase();
        if (normalizedLevel === 'country' ||
            normalizedLevel === 'state' ||
            normalizedLevel === 'district' ||
            normalizedLevel === 'city' ||
            normalizedLevel === 'area' ||
            normalizedLevel === 'village') {
            location.level = normalizedLevel;
        }
    }
    if (nextCountry)
        location.country = nextCountry;
    if (nextName) {
        location.name = nextName;
    }
    const parentIdFromBody = updateBody.parentId;
    const hasParentMutation = parentIdFromBody !== undefined;
    if (hasParentMutation) {
        if (parentIdFromBody === null || parentIdFromBody === '') {
            location.parentId = null;
        }
        else {
            const parentId = (0, locationHierarchy_1.asString)(parentIdFromBody);
            if (!parentId || !/^[a-f\d]{24}$/i.test(parentId)) {
                throw new AppError_1.AppError('Invalid parentId.', 400);
            }
            const parentExists = await (0, LocationQueryService_1.locationExists)(parentId);
            if (!parentExists) {
                throw new AppError_1.AppError('Parent location not found.', 404);
            }
            location.parentId = new mongoose_1.default.Types.ObjectId(parentId);
        }
    }
    if (latitude !== undefined && longitude !== undefined) {
        const coords = (0, LocationNormalizer_1.normalizeCoordinates)({ lat: latitude, lng: longitude });
        if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) {
            throw new AppError_1.AppError('Valid map coordinates are required.', 400);
        }
        location.coordinates = coords;
    }
    if (isActive !== undefined)
        location.isActive = Boolean(isActive);
    if (name || country || level || hasParentMutation) {
        let parentLocation = null;
        if (location.parentId) {
            parentLocation = await (0, LocationQueryService_1.findLocationParent)(location.parentId);
        }
        location.path = (0, locationHierarchy_1.buildHierarchyPath)(location._id, parentLocation);
        const parentSummary = parentLocation
            ? await (0, locationHierarchy_1.resolveLocationSummary)(parentLocation)
            : null;
        const slugParts = [
            location.name,
            parentSummary?.state,
            location.country || 'unknown'
        ].filter((part) => Boolean(part));
        location.slug = safeSlugify(slugParts.join('-'));
    }
    await (0, LocationMutationService_1.saveLocation)(location);
    await invalidateLocationStateCache();
    const [response] = await hydrateLocationResponses([location.toObject()]);
    return response;
};
exports.adminUpdateLocation = adminUpdateLocation;
const adminToggleLocationStatus = async (id) => {
    const location = await (0, LocationQueryService_1.findLocationById)(id);
    if (!location) {
        throw new AppError_1.AppError('Location not found', 404);
    }
    location.isActive = !location.isActive;
    await (0, LocationMutationService_1.saveLocation)(location);
    await invalidateLocationStateCache();
    return (0, LocationNormalizer_1.normalizeLocationResponse)(location);
};
exports.adminToggleLocationStatus = adminToggleLocationStatus;
const adminDeleteLocation = async (id, logFn) => {
    const location = await (0, LocationQueryService_1.findLocationById)(id);
    if (!location) {
        throw new AppError_1.AppError('Location not found', 404);
    }
    const locationSummary = await (0, locationHierarchy_1.resolveLocationSummary)(location.toObject());
    const adUsageQuery = {
        $or: [
            { 'location.locationId': id }
        ]
    };
    const userUsageQuery = {
        $or: [
            { locationId: id }
        ]
    };
    if (locationSummary?.city && locationSummary?.state) {
        adUsageQuery.$or.push({ 'location.city': locationSummary.city, 'location.state': locationSummary.state });
        userUsageQuery.$or.push({ 'location.city': locationSummary.city, 'location.state': locationSummary.state });
    }
    const [adsCount, usersCount] = await Promise.all([
        (0, LocationQueryService_1.countAdsForLocation)(adUsageQuery),
        (0, LocationQueryService_1.countUsersForLocation)(userUsageQuery)
    ]);
    if (adsCount > 0 || usersCount > 0) {
        throw new AppError_1.AppError(`Cannot delete location "${locationSummary?.name || location.name}". It is currently used by ${adsCount} ads and ${usersCount} users. Consider deactivating it instead.`, 409);
    }
    await (0, LocationMutationService_1.softDeleteLocation)(location);
    await invalidateLocationStateCache();
    await logFn('DELETE_LOCATION', 'Location', id, {
        name: locationSummary?.name || location.name,
        city: locationSummary?.city,
        state: locationSummary?.state
    });
    return true;
};
exports.adminDeleteLocation = adminDeleteLocation;
const adminGetGeofences = async () => {
    return (0, GeofenceService_1.getAllGeofences)();
};
exports.adminGetGeofences = adminGetGeofences;
const adminCreateGeofence = async (body, logFn) => {
    const geofence = await (0, GeofenceService_1.createGeofenceRecord)(body);
    await logFn('CREATE_GEOFENCE', 'Geofence', geofence._id.toString(), { name: geofence.name });
    return geofence;
};
exports.adminCreateGeofence = adminCreateGeofence;
const adminUpdateGeofence = async (id, body, logFn) => {
    const geofence = await (0, GeofenceService_1.updateGeofenceById)(id, body);
    if (!geofence)
        throw new AppError_1.AppError('Geofence not found', 404);
    await logFn('UPDATE_GEOFENCE', 'Geofence', id, { name: geofence.name });
    return geofence;
};
exports.adminUpdateGeofence = adminUpdateGeofence;
const adminDeleteGeofence = async (id, logFn) => {
    const geofence = await (0, GeofenceService_1.deleteGeofenceById)(id);
    if (!geofence)
        throw new AppError_1.AppError('Geofence not found', 404);
    await logFn('DELETE_GEOFENCE', 'Geofence', id, { name: geofence.name });
    return true;
};
exports.adminDeleteGeofence = adminDeleteGeofence;
const adminGetModerationQueue = async (query) => {
    const { page, limit } = parsePaginationParams(query);
    const { total, locations } = await (0, LocationQueryService_1.getModerationQueuePaginated)(page, limit);
    return { locations, total, page, limit };
};
exports.adminGetModerationQueue = adminGetModerationQueue;
const adminApproveRejectLocation = async (id, status, reason, logFn) => {
    if (![locationStatus_1.LOCATION_STATUS.VERIFIED, locationStatus_1.LOCATION_STATUS.REJECTED].includes(status)) {
        throw new AppError_1.AppError('Invalid status', 400);
    }
    const location = await (0, LocationQueryService_1.findLocationById)(id);
    if (!location)
        throw new AppError_1.AppError('Location not found', 404);
    const locationSummary = await (0, locationHierarchy_1.resolveLocationSummary)(location.toObject());
    location.verificationStatus = status;
    if (status === locationStatus_1.LOCATION_STATUS.VERIFIED)
        location.isActive = true;
    await (0, LocationMutationService_1.saveLocation)(location);
    await invalidateLocationStateCache();
    await logFn('MODERATE_LOCATION', 'Location', id, { status, reason });
    if (location.requestedBy) {
        const userId = location.requestedBy.toString();
        const templateKey = status === locationStatus_1.LOCATION_STATUS.VERIFIED ? 'LOCATION_APPROVED' : 'LOCATION_REJECTED';
        const params = { name: locationSummary?.name || location.name, reason };
        (0, NotificationService_1.dispatchTemplatedNotification)(userId, 'SYSTEM', templateKey, params, { locationId: location._id.toString(), status }).catch((notifyError) => logger_1.default.warn('Failed to notify user about location moderation', {
            locationId: String(location._id),
            status,
            error: notifyError instanceof Error ? notifyError.message : String(notifyError)
        }));
    }
    return location;
};
exports.adminApproveRejectLocation = adminApproveRejectLocation;
const adminRefreshLocationStats = async (logFn) => {
    (0, locationAnalyticsWorker_1.updateLocationStats)('manual').catch(err => logger_1.default.error('Location stats update failed', { error: err instanceof Error ? err.message : String(err) }));
    await logFn('REFRESH_STATS', 'System', 'LocationAnalytics', {});
    return true;
};
exports.adminRefreshLocationStats = adminRefreshLocationStats;
//# sourceMappingURL=AdminLocationService.js.map