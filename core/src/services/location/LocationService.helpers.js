"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCoordinates = exports.buildDisplay = exports.extractObjectIdString = exports.coerceLocationInput = exports.equalsIgnoreCase = exports.asString = void 0;
const mongoGeoUtils_1 = require("@core/utils/mongoGeoUtils");
const asString = (value) => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    if (value &&
        typeof value === 'object' &&
        typeof value.toString === 'function') {
        const converted = value.toString();
        return typeof converted === 'string' && converted.length > 0 ? converted : undefined;
    }
    return undefined;
};
exports.asString = asString;
const equalsIgnoreCase = (a, b) => {
    if (!a && !b)
        return true;
    if (!a || !b)
        return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
};
exports.equalsIgnoreCase = equalsIgnoreCase;
const coerceLocationInput = (input) => {
    if (typeof input === 'string') {
        const value = input.trim();
        return {
            name: value,
            display: value,
            city: value,
        };
    }
    if (!input || typeof input !== 'object') {
        return {};
    }
    return input;
};
exports.coerceLocationInput = coerceLocationInput;
const extractObjectIdString = (input) => {
    const normalized = (0, exports.coerceLocationInput)(input);
    const rawId = normalized.locationId ||
        normalized.id ||
        normalized._id ||
        normalized?.location?.locationId ||
        normalized?.location?.id ||
        normalized?.criteria?.locationId;
    return (0, exports.asString)(rawId);
};
exports.extractObjectIdString = extractObjectIdString;
const buildDisplay = (city, state, fallback) => {
    if (fallback && fallback.trim().length > 0)
        return fallback.trim();
    if (city && state)
        return `${city}, ${state}`;
    return city || state || 'Unknown Location';
};
exports.buildDisplay = buildDisplay;
const normalizeCoordinates = (input) => {
    return (0, mongoGeoUtils_1.normalizeToGeoJSON)(input);
};
exports.normalizeCoordinates = normalizeCoordinates;
//# sourceMappingURL=LocationService.helpers.js.map