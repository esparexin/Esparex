"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteLocation = exports.saveLocation = exports.createLocationRecord = exports.generateLocationId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Location_1 = __importDefault(require("@core/models/Location"));
const LocationCacheService_1 = require("./LocationCacheService");
/**
 * Handles all state-changing operations for the Location domain.
 */
const generateLocationId = () => new mongoose_1.default.Types.ObjectId();
exports.generateLocationId = generateLocationId;
const createLocationRecord = async (data) => {
    const location = await Location_1.default.create(data);
    if (location?._id) {
        LocationCacheService_1.LocationCacheService.set(location._id.toString(), location.toObject()).catch(() => { });
    }
    return location;
};
exports.createLocationRecord = createLocationRecord;
const saveLocation = async (location) => {
    const saved = await location.save();
    if (saved?._id) {
        LocationCacheService_1.LocationCacheService.invalidate(saved._id.toString()).catch(() => { });
    }
    return saved;
};
exports.saveLocation = saveLocation;
const softDeleteLocation = async (location) => {
    await location.softDelete();
    if (location?._id) {
        LocationCacheService_1.LocationCacheService.invalidate(location._id.toString()).catch(() => { });
    }
};
exports.softDeleteLocation = softDeleteLocation;
//# sourceMappingURL=LocationMutationService.js.map