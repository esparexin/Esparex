"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLocationInput = exports.buildLocationSlug = exports.normalizeLocationNameForSearch = exports.normalizeLocationLevel = exports.LOCATION_LEVELS = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const _shared_1 = require("@shared");
const LocationService_helpers_1 = require("@core/services/location/LocationService.helpers");
const stringUtils_1 = require("./stringUtils");
const idUtils_1 = require("./idUtils");
const locationHierarchy_1 = require("./locationHierarchy");
const Location_1 = __importDefault(require("@core/models/Location"));
const locationHierarchy_2 = require("./locationHierarchy");
const locationPrimitives_1 = require("./locationPrimitives");
Object.defineProperty(exports, "LOCATION_LEVELS", { enumerable: true, get: function () { return locationPrimitives_1.LOCATION_LEVELS; } });
Object.defineProperty(exports, "normalizeLocationLevel", { enumerable: true, get: function () { return locationPrimitives_1.normalizeLocationLevel; } });
Object.defineProperty(exports, "normalizeLocationNameForSearch", { enumerable: true, get: function () { return locationPrimitives_1.normalizeLocationNameForSearch; } });
Object.defineProperty(exports, "buildLocationSlug", { enumerable: true, get: function () { return locationPrimitives_1.buildLocationSlug; } });
const extractCoordinates = (value) => {
    if (value &&
        typeof value === 'object' &&
        value.type === 'Point' &&
        (0, _shared_1.hasValidCoordinateArray)(value.coordinates)) {
        return [...value.coordinates];
    }
    if (value &&
        typeof value === 'object' &&
        'coordinates' in value &&
        (0, _shared_1.hasValidCoordinateArray)(value.coordinates)) {
        return [...(value.coordinates)];
    }
    throw new Error('Invalid coordinates');
};
const normalizeAliases = (value) => {
    if (!Array.isArray(value))
        return [];
    return Array.from(new Set(value
        .map((entry) => (0, stringUtils_1.toTitleCase)((0, LocationService_helpers_1.asString)(entry)))
        .filter((entry) => Boolean(entry))));
};
const normalizeLocationInput = async (input, options = {}) => {
    const level = (0, locationPrimitives_1.normalizeLocationLevel)(input.level) || 'city';
    const preferredName = (0, LocationService_helpers_1.asString)(input.name) ||
        (level === 'district' ? (0, LocationService_helpers_1.asString)(input.district) : undefined) ||
        (0, LocationService_helpers_1.asString)(input.city) ||
        '';
    const name = (0, stringUtils_1.toTitleCase)(preferredName);
    const city = (0, stringUtils_1.toTitleCase)((0, LocationService_helpers_1.asString)(input.city) || name);
    const state = (0, stringUtils_1.toTitleCase)((0, LocationService_helpers_1.asString)(input.state) || '');
    const country = (0, stringUtils_1.toTitleCase)((0, LocationService_helpers_1.asString)(input.country) || options.defaultCountry || 'Unknown');
    const district = (0, stringUtils_1.toTitleCase)((0, LocationService_helpers_1.asString)(input.district) || '');
    const coordinates = extractCoordinates(input.coordinates);
    const normalizedName = (0, locationPrimitives_1.normalizeLocationNameForSearch)(name);
    if (!name || !normalizedName) {
        throw new Error('Location name is required');
    }
    const slug = (0, locationPrimitives_1.buildLocationSlug)(name, city, state || country);
    const aliases = normalizeAliases(input.aliases);
    let parentId = (0, idUtils_1.toObjectId)(input.parentId);
    let path = [];
    let parentLocation = null;
    if (parentId) {
        parentLocation = await Location_1.default.findOne({ _id: parentId, isActive: true })
            .select('_id path')
            .lean();
        if (!parentLocation) {
            throw new Error('Invalid parent location');
        }
    }
    else if (options.resolveHierarchy) {
        parentLocation = await (0, locationHierarchy_2.resolveParentLocation)({
            level,
            country,
            state,
            district,
            city,
            excludeId: options.excludeId
        });
        parentId = parentLocation?._id || null;
    }
    const documentId = options.documentId || new mongoose_1.default.Types.ObjectId();
    path = (0, locationHierarchy_1.buildHierarchyPath)(documentId, parentLocation);
    if (options.ensureUnique) {
        const duplicate = await Location_1.default.findOne({
            isActive: true,
            normalizedName,
            level,
            state,
            ...(parentId ? { parentId } : {}),
            ...(options.excludeId && mongoose_1.default.Types.ObjectId.isValid(String(options.excludeId))
                ? { _id: { $ne: new mongoose_1.default.Types.ObjectId(String(options.excludeId)) } }
                : {})
        })
            .select('_id')
            .lean();
        if (duplicate) {
            throw new Error('Duplicate location detected');
        }
    }
    return {
        documentId,
        name,
        normalizedName,
        slug,
        city,
        state,
        country,
        district: district || undefined,
        level,
        aliases,
        coordinates: {
            type: 'Point',
            coordinates
        },
        parentId,
        path
    };
};
exports.normalizeLocationInput = normalizeLocationInput;
//# sourceMappingURL=locationInputNormalizer.js.map