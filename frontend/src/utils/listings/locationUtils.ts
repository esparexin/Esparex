import { normalizeOptionalObjectId } from "../normalizeOptionalObjectId";
import { 
    resolveCanonicalLocationId, 
    normalizeListingLocation,
    sanitizeMongoObjectId 
} from "@shared/listingUtils/locationUtils";

/**
 * 📍 Location Utilities for Listings
 */

export { 
    normalizeOptionalObjectId, 
    resolveCanonicalLocationId, 
    normalizeListingLocation,
    sanitizeMongoObjectId
};

/**
 * Formats a location for display in the UI.
 */
export const formatLocationDisplay = (location: any): string => {
    if (!location) return "";
    if (typeof location === 'string') return location;
    
    if (location.display) return location.display;
    
    const parts = [location.city, location.state].filter(Boolean);
    return parts.join(", ");
};
