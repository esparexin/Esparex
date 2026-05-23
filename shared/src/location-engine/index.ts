/**
 * @module shared/location-engine
 *
 * 🌍 CANONICAL Location Engine — Single Source of Truth import path.
 *
 * This barrel provides a unified interface for all location-related logic
 * that is safe to run in both Frontend and Backend environments.
 *
 * NOTE: Database-specific operations (Mongoose models, findOne, etc.)
 * have been moved to the @core package to maintain environment safety.
 */

// ── geoPoint & radius ────────────────────────────────────────────────────────
// GeoJSON type, coordinate validators, and distance math.
export {
    isValidLongitude,
    isValidLatitude,
    isNonZeroLngLat,
    isValidLngLat,
    hasValidCoordinateArray,
    isValidGeoPoint,
    normalizeGeoPoint,
    MIN_RADIUS_KM,
    MAX_RADIUS_KM,
    DEFAULT_RADIUS_KM,
    haversineDistance
} from '../utils/geoUtils';

// ── hierarchy ────────────────────────────────────────────────────────────────
// Shared primitives: enums, basic slug building, and level normalization.
export {
    LOCATION_LEVELS,
    normalizeLocationLevel,
    normalizeLocationNameForSearch,
    buildLocationSlug,
} from '../utils/locationPrimitives';

export {
    LOCATION_LEVELS as HIERARCHY_LEVELS,
    normalizeLocationLevel as normalizeHierarchyLevel,
} from '../utils/locationPrimitives';
