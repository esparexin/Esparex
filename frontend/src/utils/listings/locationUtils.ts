import { normalizeOptionalObjectId } from "../normalizeOptionalObjectId";
import {
    resolveCanonicalLocationId,
    normalizeListingLocation,
    sanitizeMongoObjectId,
    formatLocationDisplay
} from "@shared/listingUtils/locationUtils";

/**
 * 📍 Location Utilities for Listings — re-export barrel.
 * All logic lives in @shared/listingUtils/locationUtils (SSOT).
 */

export {
    normalizeOptionalObjectId,
    resolveCanonicalLocationId,
    normalizeListingLocation,
    sanitizeMongoObjectId,
    formatLocationDisplay
};
