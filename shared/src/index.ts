// Esparex Shared Package Entry Point
// Export common schemas, enums, constants and utilities

/**
 * @deprecated The contracts proxy re-export is a temporary compatibility layer.
 * All consumers must import directly from `@esparex/contracts`.
 * This proxy export will be removed in Phase 2.
 */
export * from '@esparex/contracts';

// CONSTANTS: only bannedWords remains exclusively in @esparex/shared (business logic)
// adLimits, fieldLimits, adminNotificationTargets, mobileVisibility constants,
// locationEvents, notificationRetention are all now in @esparex/contracts above.
export * from './constants/bannedWords';
// normalizeMobileVisibility is a utility function — not in contracts, stays here
export { normalizeMobileVisibility } from './constants/mobileVisibility';

// UTILS (remain in @esparex/shared)
export * from './utils/formatters';
export * from './utils/statusNormalization';
export * from './utils/userStatus';
export * from './utils/categoryFilters';
export * from './utils/securityPatterns';
export * from './utils/resolveCategoryId';
// geoUtils — radius constants are now in @esparex/contracts; export only utility functions
export type { GeoJSONPoint } from './utils/geoUtils';
export {
    haversineDistance,
    isValidLongitude, isValidLatitude, isNonZeroLngLat, isValidLngLat,
    hasValidCoordinateArray, isValidGeoPoint, normalizeGeoPoint,
    getLatitude, getLongitude, hasCoordinates, createPoint, toCanonicalGeoPoint
} from './utils/geoUtils';
// locationPrimitives functions (LOCATION_LEVELS, normalizeLocationLevel, normalizeLocationNameForSearch, buildLocationSlug)
// LocationLevel type is now provided by @esparex/contracts above
export {
    LOCATION_LEVELS,
    normalizeLocationLevel,
    normalizeLocationNameForSearch,
    buildLocationSlug
} from './utils/locationPrimitives';
export * from './utils/textValidator';
export * from './utils/catalogNamingValidator';
export * from './utils/planEntitlements';
// listingUtils functions (sanitizeMongoObjectId, resolveCanonicalLocationId, normalizeListingLocation, formatLocationDisplay)
// ListingLocation type is now provided by @esparex/contracts above
export {
    sanitizeMongoObjectId, resolveCanonicalLocationId,
    normalizeListingLocation, formatLocationDisplay
} from './listingUtils/locationUtils';
export * from './listingUtils/imageUtils';
export { adaptLocationInput } from './location/location.utils';

// POPUP (remain in @esparex/shared)
export * from './popup/popupCore';
export * from './popup/popupEvents';
export * from './popup/popupQueue';

// API ROUTE CONSTANTS (remain in @esparex/shared — not wire types)
export * from './contracts/api/basePaths';
export * from './contracts/api/userRoutes';
export * from './contracts/api/adminRoutes';
export * from './contracts/api/resourceNames';
// Note: chat.contracts migrated to @esparex/contracts — covered by export * above

// OBSERVABILITY (remain in @esparex/shared)
export * from './observability/trace';
export * from './observability/types';
export { getLogger } from './observability/index';
export { createUniversalLogger } from './observability/logger';

// IMAGE DOMAIN REGISTRY
import * as imageDomainRegistry from './constants/image-domain-registry.json';
export { imageDomainRegistry };
export default imageDomainRegistry;
