"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toGeoPoint = exports.sanitizeGeoPoint = exports.isValidGeoPoint = exports.hasValidCoordinateArray = exports.isValidLngLat = exports.isNonZeroLngLat = exports.isValidLatitude = exports.isValidLongitude = exports.haversineDistance = exports.DEFAULT_RADIUS_KM = exports.MAX_RADIUS_KM = exports.MIN_RADIUS_KM = void 0;
const zod_1 = require("zod");
const coordsTupleSchema = zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]);
const latLngObjSchema = zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() });
exports.MIN_RADIUS_KM = 1;
exports.MAX_RADIUS_KM = 500;
exports.DEFAULT_RADIUS_KM = 50;
/**
 * Calculates the Haversine distance between two points in kilometers.
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.haversineDistance = haversineDistance;
const isValidLongitude = (value) => typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180;
exports.isValidLongitude = isValidLongitude;
const isValidLatitude = (value) => typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90;
exports.isValidLatitude = isValidLatitude;
const isNonZeroLngLat = (lng, lat) => !(lng === 0 && lat === 0);
exports.isNonZeroLngLat = isNonZeroLngLat;
const isValidLngLat = (lng, lat) => (0, exports.isValidLongitude)(lng) &&
    (0, exports.isValidLatitude)(lat) &&
    (0, exports.isNonZeroLngLat)(lng, lat);
exports.isValidLngLat = isValidLngLat;
const hasValidCoordinateArray = (coords) => Array.isArray(coords) &&
    coords.length === 2 &&
    (0, exports.isValidLngLat)(coords[0], coords[1]);
exports.hasValidCoordinateArray = hasValidCoordinateArray;
const isValidGeoPoint = (input) => {
    try {
        if (!input || typeof input !== 'object')
            return false;
        const obj = input;
        return obj.type === 'Point'
            && (0, exports.hasValidCoordinateArray)(obj.coordinates);
    }
    catch {
        return false;
    }
};
exports.isValidGeoPoint = isValidGeoPoint;
/**
 * Safe GeoJSON Point guard — validates coordinates without throwing.
 * Returns the original object unchanged when valid; undefined when invalid.
 * Used in Mongoose pre-save/findOneAndUpdate hooks as a no-op passthrough guard.
 */
const sanitizeGeoPoint = (value) => {
    if (!value || typeof value !== 'object')
        return undefined;
    const node = value;
    const coords = Array.isArray(node.coordinates) ? node.coordinates : undefined;
    return coords && (0, exports.hasValidCoordinateArray)(coords) ? node : undefined;
};
exports.sanitizeGeoPoint = sanitizeGeoPoint;
/**
 * Extracts and strictly formats a GeoJSON Point [lng, lat].
 * THROWS explicit errors on bad data to prevent silent logic bypasses.
 */
const toGeoPoint = (input) => {
    if (!input) {
        throw new Error("ERR_GEO_01: Input coordinates cannot be null or undefined.");
    }
    if ((0, exports.isValidGeoPoint)(input)) {
        return {
            type: 'Point',
            coordinates: [Number(input.coordinates[0]), Number(input.coordinates[1])]
        };
    }
    const rawInput = input;
    if (rawInput.coordinates && (0, exports.isValidGeoPoint)(rawInput.coordinates)) {
        return {
            type: 'Point',
            coordinates: [Number(rawInput.coordinates.coordinates[0]), Number(rawInput.coordinates.coordinates[1])]
        };
    }
    const latLngParse = latLngObjSchema.safeParse(input);
    if (latLngParse.success) {
        if (!(0, exports.isValidLngLat)(latLngParse.data.lng, latLngParse.data.lat)) {
            throw new Error("ERR_GEO_03: Coordinates must be within valid longitude/latitude bounds and cannot be [0,0].");
        }
        return {
            type: 'Point',
            coordinates: [latLngParse.data.lng, latLngParse.data.lat]
        };
    }
    const tupleParse = coordsTupleSchema.safeParse(input);
    if (tupleParse.success) {
        if (!(0, exports.isValidLngLat)(tupleParse.data[0], tupleParse.data[1])) {
            throw new Error("ERR_GEO_03: Coordinates must be within valid longitude/latitude bounds and cannot be [0,0].");
        }
        return {
            type: 'Point',
            coordinates: [tupleParse.data[0], tupleParse.data[1]]
        };
    }
    throw new Error(`ERR_GEO_02: Unrecognized location format: ${JSON.stringify(input)}`);
};
exports.toGeoPoint = toGeoPoint;
//# sourceMappingURL=geoUtils.js.map