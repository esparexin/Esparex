import { normalizeOptionalObjectId } from "../normalizeOptionalObjectId";
import {
    resolveCanonicalLocationId,
    normalizeListingLocation,
    sanitizeMongoObjectId,
    formatLocationDisplay
} from "@shared";

/**
 * 📍 Location Utilities for Listings — re-export barrel.
 * All logic lives in @shared (SSOT).
 */

export {
    normalizeOptionalObjectId,
    resolveCanonicalLocationId,
    normalizeListingLocation,
    sanitizeMongoObjectId,
    formatLocationDisplay
};
