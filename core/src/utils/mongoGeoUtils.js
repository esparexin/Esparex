"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistance = exports.buildGeoNearStage = exports.normalizeToGeoJSON = exports.normalizeGeoInput = void 0;
const shared_1 = require("@esparex/shared");
/**
 * 🌍 CANONICAL GEO UTILITY LAYER
 * SSOT for all coordinate normalization, distance logic, and MongoDB geo-query building.
 */
/**
 * Normalizes input coordinates into a standard object with a boolean flag.
 * Leverages shared validators but ensures a safe return for query builders.
 */
const normalizeGeoInput = (lat, lng) => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const hasGeo = (0, shared_1.isValidLngLat)(lngNum, latNum);
    return {
        lat: hasGeo ? latNum : 0,
        lng: hasGeo ? lngNum : 0,
        hasGeo
    };
};
exports.normalizeGeoInput = normalizeGeoInput;
/**
 * Coerces varied location input shapes into a canonical GeoJSON Point.
 * Handles strings, objects with lat/lng, and nested GeoJSON structures.
 */
const normalizeToGeoJSON = (input) => {
    if (!input)
        return undefined;
    try {
        return (0, shared_1.toGeoPoint)(input);
    }
    catch {
        return undefined;
    }
};
exports.normalizeToGeoJSON = normalizeToGeoJSON;
/**
 * Builds a standardized $geoNear stage for aggregation pipelines.
 * Enforces high-performance bounds and coordinate consistency.
 */
const buildGeoNearStage = (options) => {
    const { lng: rawLng, lat: rawLat, key = 'location.coordinates', radiusKm, distanceField = 'distance', query = {} } = options;
    const { lat, lng, hasGeo } = (0, exports.normalizeGeoInput)(rawLat, rawLng);
    if (!hasGeo) {
        throw new Error('ERR_GEO_04: Invalid coordinates for $geoNear. Must be finite and non-zero.');
    }
    // Enforce standardized radius caps
    const safeRadius = Math.min(Math.max(Number(radiusKm) || shared_1.DEFAULT_RADIUS_KM, shared_1.MIN_RADIUS_KM), shared_1.MAX_RADIUS_KM);
    return {
        $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            key,
            distanceField,
            spherical: true,
            maxDistance: safeRadius * 1000, // MongoDB uses meters
            query
        }
    };
};
exports.buildGeoNearStage = buildGeoNearStage;
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
//# sourceMappingURL=mongoGeoUtils.js.map