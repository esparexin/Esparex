import { normalizeOptionalObjectId } from "../normalizeOptionalObjectId";
import {
    resolveCanonicalLocationId,
    normalizeListingLocation,
    sanitizeMongoObjectId,
    formatLocationDisplay
} from "@esparex/shared/listingUtils/locationUtils";

/**
 * 📍 Location Utilities for Listings — re-export barrel.
 * All logic lives in @esparex/shared/listingUtils/locationUtils (SSOT).
 */

export {
    normalizeOptionalObjectId,
    resolveCanonicalLocationId,
    normalizeListingLocation,
    sanitizeMongoObjectId,
    formatLocationDisplay
};
