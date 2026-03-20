/**
 * @module shared/location-engine
 *
 * CANONICAL Location Engine — Single Source of Truth import path.
 *
 * All geo, hierarchy, radius, and normalisation utilities are re-exported
 * from this barrel so new code only ever imports from:
 *
 *   import { ... } from '@shared/location-engine';
 *
 * The backing implementation files remain at their current paths for
 * backward compatibility with existing import sites. Migration of existing
 * call sites to this barrel is tracked separately and can happen
 * incrementally without a flag day.
 *
 * Module map:
 *   geoPoint  → shared/utils/geoUtils.ts
 *   radius    → backend/src/utils/GeoUtils.ts       (backport: subset types)
 *   hierarchy → backend/src/utils/locationHierarchy.ts
 *   normalise → backend/src/utils/locationInputNormalizer.ts
 */

// ── geoPoint ────────────────────────────────────────────────────────────────
// GeoJSON type, coordinate validators, toGeoPoint converter.
export {
    type GeoJSONPoint,
    isValidLongitude,
    isValidLatitude,
    isNonZeroLngLat,
    isValidLngLat,
    hasValidCoordinateArray,
    isValidGeoPoint,
    toGeoPoint,
} from '../utils/geoUtils';

// ── hierarchy ────────────────────────────────────────────────────────────────
// Location level enum, parent resolution, path building.
// NOTE: These functions are backend-only (they import Mongoose models).
//       Do NOT import this barrel in frontend/SSR code — use the type-only
//       exports from shared/utils/geoUtils instead.
export {
    LOCATION_LEVELS,
    type LocationLevel,
    normalizeLocationLevel,
    normalizeLocationNameForSearch,
    buildLocationSlug,
    normalizeLocationInput,
    type NormalizedLocationPersistenceInput,
} from '../../backend/src/utils/locationInputNormalizer';

// ── hierarchy (advanced) ─────────────────────────────────────────────────────
// Parent resolution, path deduplication, ancestor chain traversal.
export {
    HIERARCHY_LEVELS,
    type HierarchyLevel,
    normalizeHierarchyLevel,
    buildHierarchyPath,
    resolveParentLocation,
    resolveLocationPathIds,
} from '../../backend/src/utils/locationHierarchy';

// ── radius ───────────────────────────────────────────────────────────────────
// $geoNear stage builder, radius constants, coord normalisation.
export {
    MIN_RADIUS_KM,
    MAX_RADIUS_KM,
    DEFAULT_RADIUS_KM,
    normalizeGeoInput,
    normalizeToGeoJSON,
    type GeoNearOptions,
    buildGeoNearStage,
} from '../../backend/src/utils/GeoUtils';
