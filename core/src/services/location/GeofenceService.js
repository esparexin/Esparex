"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGeofenceById = exports.updateGeofenceById = exports.createGeofenceRecord = exports.getAllGeofences = void 0;
const Geofence_1 = __importDefault(require("@core/models/Geofence"));
/**
 * Handles all Geofence-specific CRUD operations.
 */
const getAllGeofences = async () => Geofence_1.default.find().sort({ createdAt: -1 });
exports.getAllGeofences = getAllGeofences;
const createGeofenceRecord = async (data) => Geofence_1.default.create(data);
exports.createGeofenceRecord = createGeofenceRecord;
const updateGeofenceById = async (id, data) => {
    if (!id)
        return null;
    return Geofence_1.default.findByIdAndUpdate(id, data, { new: true });
};
exports.updateGeofenceById = updateGeofenceById;
const deleteGeofenceById = async (id) => {
    if (!id)
        return null;
    return Geofence_1.default.findByIdAndDelete(id);
};
exports.deleteGeofenceById = deleteGeofenceById;
//# sourceMappingURL=GeofenceService.js.map