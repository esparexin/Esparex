"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshLocationStats = exports.approveRejectLocation = exports.getModerationQueue = exports.deleteGeofence = exports.updateGeofence = exports.createGeofence = exports.getGeofences = exports.deleteLocation = exports.toggleLocationStatus = exports.updateLocation = exports.createLocation = exports.getAllLocations = exports.reverseGeocode = exports.getDistinctStates = exports.createAreaLocation = exports.createCityLocation = exports.createStateLocation = void 0;
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const adminLocationService = __importStar(require("@esparex/core/services/AdminLocationService"));
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
const getActorId = (req) => req.user?._id?.toString() ?? req.user?.id ?? '';
const getIp = (req) => ((req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0] ?? '').trim();
const getUserAgent = (req) => req.headers['user-agent'] || '';
const buildLogFn = (req) => (action, targetType, targetId, metadata) => (0, adminLogger_1.logAdminActionDirect)(getActorId(req), action, targetType, targetId, metadata, getIp(req), getUserAgent(req));
// ---------------------------------------------------------
// Controllers
// ---------------------------------------------------------
const createStateLocation = async (req, res) => {
    try {
        const location = await adminLocationService.adminCreateStateLocation(req.body);
        return (0, adminBaseController_1.sendSuccessResponse)(res, location);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.createStateLocation = createStateLocation;
const createCityLocation = async (req, res) => {
    try {
        const location = await adminLocationService.adminCreateCityLocation(req.body);
        return (0, adminBaseController_1.sendSuccessResponse)(res, location);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.createCityLocation = createCityLocation;
const createAreaLocation = async (req, res) => {
    try {
        const location = await adminLocationService.adminCreateAreaLocation(req.body);
        return (0, adminBaseController_1.sendSuccessResponse)(res, location);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.createAreaLocation = createAreaLocation;
const getDistinctStates = async (req, res) => {
    try {
        const states = await adminLocationService.adminGetDistinctStates();
        return (0, adminBaseController_1.sendSuccessResponse)(res, states);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getDistinctStates = getDistinctStates;
const reverseGeocode = async (req, res) => {
    try {
        const match = await adminLocationService.adminReverseGeocode(req.query.lat, req.query.lng);
        (0, adminBaseController_1.sendSuccessResponse)(res, match);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.reverseGeocode = reverseGeocode;
const getAllLocations = async (req, res) => {
    try {
        const { items, total, page, limit } = await adminLocationService.adminGetAllLocations(req.query);
        return (0, adminBaseController_1.sendPaginatedResponse)(res, items, total, page, limit);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getAllLocations = getAllLocations;
const createLocation = async (req, res) => {
    try {
        const location = await adminLocationService.adminCreateLocation(req.body);
        return (0, adminBaseController_1.sendSuccessResponse)(res, location);
    }
    catch (error) {
        const code = typeof error === 'object' && error !== null ? error.code : undefined;
        if (code === 11000) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Duplicate location detected.', 400);
        }
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.createLocation = createLocation;
const updateLocation = async (req, res) => {
    try {
        const location = await adminLocationService.adminUpdateLocation(req.params.id, req.body);
        return (0, adminBaseController_1.sendSuccessResponse)(res, location);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.updateLocation = updateLocation;
const toggleLocationStatus = async (req, res) => {
    try {
        const location = await adminLocationService.adminToggleLocationStatus(req.params.id);
        return (0, adminBaseController_1.sendSuccessResponse)(res, location);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.toggleLocationStatus = toggleLocationStatus;
const deleteLocation = async (req, res) => {
    try {
        await adminLocationService.adminDeleteLocation(req.params.id, buildLogFn(req));
        return (0, adminBaseController_1.sendSuccessResponse)(res, null, 'Location deleted successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.deleteLocation = deleteLocation;
const getGeofences = async (req, res) => {
    try {
        const geofences = await adminLocationService.adminGetGeofences();
        return (0, adminBaseController_1.sendSuccessResponse)(res, geofences);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getGeofences = getGeofences;
const createGeofence = async (req, res) => {
    try {
        const geofence = await adminLocationService.adminCreateGeofence(req.body, buildLogFn(req));
        return (0, adminBaseController_1.sendSuccessResponse)(res, geofence);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.createGeofence = createGeofence;
const updateGeofence = async (req, res) => {
    try {
        const geofence = await adminLocationService.adminUpdateGeofence(req.params.id, req.body, buildLogFn(req));
        return (0, adminBaseController_1.sendSuccessResponse)(res, geofence);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.updateGeofence = updateGeofence;
const deleteGeofence = async (req, res) => {
    try {
        await adminLocationService.adminDeleteGeofence(req.params.id, buildLogFn(req));
        return (0, adminBaseController_1.sendSuccessResponse)(res, null, 'Geofence deleted');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.deleteGeofence = deleteGeofence;
const getModerationQueue = async (req, res) => {
    try {
        const { locations, total, page, limit } = await adminLocationService.adminGetModerationQueue(req.query);
        return (0, adminBaseController_1.sendPaginatedResponse)(res, locations, total, page, limit);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getModerationQueue = getModerationQueue;
const approveRejectLocation = async (req, res) => {
    try {
        const body = req.body;
        const location = await adminLocationService.adminApproveRejectLocation(req.params.id, body.status, body.reason, buildLogFn(req));
        return (0, adminBaseController_1.sendSuccessResponse)(res, location);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.approveRejectLocation = approveRejectLocation;
const refreshLocationStats = async (req, res) => {
    try {
        await adminLocationService.adminRefreshLocationStats(buildLogFn(req));
        return (0, adminBaseController_1.sendSuccessResponse)(res, null, 'Location statistics update queued successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.refreshLocationStats = refreshLocationStats;
//# sourceMappingURL=adminLocationController.js.map