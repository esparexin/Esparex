/**
 * 📍 Location Utilities for Listings
 * Enforces `locationId` as the canonical key and consolidates normalization.
 */

export const MONGOOSE_OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

/**
 * Validates and sanitizes a MongoDB ObjectId.
 */
export function sanitizeMongoObjectId(value: unknown): string | undefined {
    if (typeof value !== "string" && typeof value !== "number") return undefined;
    const trimmed = String(value).trim();
    if (!trimmed || !MONGOOSE_OBJECT_ID_REGEX.test(trimmed)) return undefined;
    return trimmed;
}

/**
 * Ensures a location object has a canonical `locationId`.
 * Prioritizes `locationId`, then falls back to `placeId` or `id`.
 */
export function resolveCanonicalLocationId(location: any): string | undefined {
    if (!location || typeof location !== "object") return undefined;
    
    const candidate = 
        location.locationId || 
        location.placeId || 
        location.id;
        
    return sanitizeMongoObjectId(candidate);
}

/**
 * Formats a location object or string for display in the UI.
 * Returns the most descriptive available string (display > city > city, state).
 */
export function formatLocationDisplay(location: unknown): string {
    if (!location) return "";
    if (typeof location === "string") return location;
    const loc = location as Record<string, unknown>;
    if (typeof loc.display === "string" && loc.display) return loc.display;
    const parts = [loc.city, loc.state].filter(
        (v): v is string => typeof v === "string" && (v as string).trim().length > 0
    );
    return parts.join(", ");
}

/**
 * Normalizes a raw location into a stable structure for the UI.
 * Ensures `locationId` is always present if a valid ID exists.
 */
export function normalizeListingLocation(raw: any) {
    if (!raw) return null;
    
    // Handle string inputs (manual entry or legacy)
    if (typeof raw === "string") {
        const value = raw.trim();
        if (!value) return null;
        const parts = value.split(",");
        const city = parts[0]?.trim() || value;
        const state = parts[1]?.trim() || city;
        return {
            display: value,
            city,
            state,
            country: "India", // Default for platform
            locationId: undefined,
            coordinates: undefined
        };
    }

    const city = (typeof raw.city === "string" && raw.city) || (typeof raw.name === "string" && raw.name) || "";
    const state = (typeof raw.state === "string" && raw.state) || city;
    const display = raw.display || raw.formattedAddress || raw.address || city;
    
    const locationId = resolveCanonicalLocationId(raw);
    
    // Extract coordinates safely
    let coordinates = raw.coordinates;
    if (coordinates && coordinates.type === "Point" && Array.isArray(coordinates.coordinates)) {
        // Already canonical
    } else if (Array.isArray(raw.coordinates) && raw.coordinates.length === 2) {
        coordinates = { type: "Point", coordinates: raw.coordinates };
    } else if (typeof raw.lat === "number" && typeof raw.lng === "number") {
        coordinates = { type: "Point", coordinates: [raw.lng, raw.lat] };
    } else {
        coordinates = undefined;
    }

    return {
        display,
        city,
        state,
        country: raw.country || "India",
        locationId,
        coordinates
    };
}
