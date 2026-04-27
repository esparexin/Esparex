"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countUsersForLocation = exports.countAdsForLocation = exports.getModerationQueuePaginated = exports.getLocationsPaginated = exports.getDistinctStateLocations = exports.findDuplicateLocation = exports.findLocationParent = exports.locationExists = exports.findActiveParentById = exports.findLocationByIdLean = exports.findLocationById = void 0;
const Location_1 = __importDefault(require("@core/models/Location"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const User_1 = __importDefault(require("@core/models/User"));
const locationStatus_1 = require("@core/constants/enums/locationStatus");
const logger_1 = __importDefault(require("@core/utils/logger"));
const LOCATION_LIST_HINT = { isActive: 1, createdAt: -1 };
let hasWarnedLocationListHintFailure = false;
/**
 * Handles read operations and paginated queries for the Location domain.
 */
const LocationCacheService_1 = require("./LocationCacheService");
const findLocationById = async (id) => {
    if (!id)
        return null;
    // 🚀 CACHE-ASIDE: Check secondary layer first
    const cached = (await LocationCacheService_1.LocationCacheService.get(id));
    if (cached)
        return cached;
    const location = await Location_1.default.findById(id);
    if (location) {
        // Run as side effect to avoid blocking response
        LocationCacheService_1.LocationCacheService.set(id, (location.toObject ? location.toObject() : location)).catch(() => { });
    }
    return location;
};
exports.findLocationById = findLocationById;
const findLocationByIdLean = async (id, select) => {
    if (!id)
        return null;
    // For lean lookups with custom select, we check if the full doc is cached
    // If not cached, we fetch from DB. We don't cache partials to avoid key explosion.
    const cached = await LocationCacheService_1.LocationCacheService.get(id);
    if (cached) {
        // If select is provided, we might need to filter. 
        // For simplicity, if cached, we return the cached doc as is if it satisfies the requirement.
        return cached;
    }
    const location = await Location_1.default.findById(id).select(select).lean();
    return location;
};
exports.findLocationByIdLean = findLocationByIdLean;
const findActiveParentById = async (id) => Location_1.default.findOne({ _id: id, isActive: true })
    .select('_id level path')
    .lean();
exports.findActiveParentById = findActiveParentById;
const locationExists = async (id) => Location_1.default.exists({ _id: id, isActive: true });
exports.locationExists = locationExists;
const findLocationParent = async (parentId) => Location_1.default.findById(parentId)
    .select('_id level path country')
    .lean();
exports.findLocationParent = findLocationParent;
const findDuplicateLocation = async (name, country, level, parentId) => Location_1.default.findOne({
    name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    country,
    level,
    parentId: parentId || null,
});
exports.findDuplicateLocation = findDuplicateLocation;
const getDistinctStateLocations = async () => Location_1.default.find({ isActive: true, level: 'state' })
    .select('name')
    .lean();
exports.getDistinctStateLocations = getDistinctStateLocations;
const getLocationsPaginated = async (query, skip, limit) => {
    const hasAnyFilter = Object.keys(query).length > 0;
    const buildQuery = () => Location_1.default.find(query)
        .select('_id name slug country level parentId path coordinates isActive verificationStatus createdAt updatedAt')
        .lean()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const getTotal = async () => {
        if (!hasAnyFilter)
            return Location_1.default.estimatedDocumentCount();
        try {
            return await Location_1.default.countDocuments(query).hint(LOCATION_LIST_HINT);
        }
        catch (error) {
            if (!hasWarnedLocationListHintFailure) {
                hasWarnedLocationListHintFailure = true;
                logger_1.default.warn('Location count hint unavailable; retrying without hint', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            return Location_1.default.countDocuments(query);
        }
    };
    const getLocations = async () => {
        if (!hasAnyFilter)
            return buildQuery();
        try {
            return await buildQuery().hint(LOCATION_LIST_HINT);
        }
        catch (error) {
            if (!hasWarnedLocationListHintFailure) {
                hasWarnedLocationListHintFailure = true;
                logger_1.default.warn('Location list hint unavailable; retrying without hint', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            return buildQuery();
        }
    };
    const [total, locations] = await Promise.all([getTotal(), getLocations()]);
    return { locations: locations, total };
};
exports.getLocationsPaginated = getLocationsPaginated;
const getModerationQueuePaginated = async (page, limit) => {
    const query = { verificationStatus: locationStatus_1.LOCATION_STATUS.PENDING };
    const [total, locations] = await Promise.all([
        Location_1.default.countDocuments(query).hint({ verificationStatus: 1, createdAt: 1 }),
        Location_1.default.find(query)
            .select('_id name city district state country level coordinates isActive verificationStatus requestedBy createdAt')
            .lean()
            .populate('requestedBy', 'firstName lastName email')
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit),
    ]);
    return { total, locations };
};
exports.getModerationQueuePaginated = getModerationQueuePaginated;
const countAdsForLocation = async (query) => Ad_1.default.countDocuments(query);
exports.countAdsForLocation = countAdsForLocation;
const countUsersForLocation = async (query) => User_1.default.countDocuments(query);
exports.countUsersForLocation = countUsersForLocation;
//# sourceMappingURL=LocationQueryService.js.map