/**
 * 📍 Location Utilities for Listings
 * Enforces `locationId` as the canonical key and consolidates normalization.
 */

import { type GeoJSONPoint, normalizeGeoPoint } from "../utils/geoUtils";
import { sanitizeMongoObjectId } from "../validators/mongo";

export { sanitizeMongoObjectId };

export type ListingLocation = {
  locationId?: string;
  display?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: GeoJSONPoint;
};

/**
 * Ensures a location object has a canonical `locationId`.
 * Prioritizes `locationId`, then falls back to `id`.
 */
export function resolveCanonicalLocationId(location: unknown): string | undefined {
    if (!location || typeof location !== "object") return undefined;

    const loc = location as Record<string, unknown>;

    const candidate =
        typeof loc.locationId === "string"
            ? loc.locationId
            : typeof loc.id === "string"
            ? loc.id
            : undefined;

    return sanitizeMongoObjectId(candidate);
}

/**
 * Formats a location object or string for display in the UI.
 * Returns the most descriptive available string (display > city > city, state).
 */
export function formatLocationDisplay(location: unknown): string {
    if (!location) return "";

    if (typeof location === "string") return location;

    if (typeof location !== "object") return "";

    const loc = location as Record<string, unknown>;

    if (typeof loc.display === "string" && loc.display.trim()) {
        return loc.display;
    }

    const city = typeof loc.city === "string" ? loc.city : "";
    const state = typeof loc.state === "string" ? loc.state : "";

    return [city, state].filter(Boolean).join(", ");
}

/**
 * Normalizes a raw location into a stable structure for the UI.
 * Ensures `locationId` is always present if a valid ID exists.
 */
export function normalizeListingLocation(raw: unknown): ListingLocation | null {
    if (!raw) return null;

    if (typeof raw === "string") {
        const value = raw.trim();
        if (!value) return null;

        const [cityRaw, stateRaw] = value.split(",");
        const city = cityRaw?.trim() || value;
        const state = stateRaw?.trim() || city;

        return {
            display: value,
            city,
            state,
            country: "India"
        };
    }

    if (typeof raw !== "object") return null;

    const loc = raw as Record<string, unknown>;

    const city =
        typeof loc.city === "string"
            ? loc.city
            : typeof loc.name === "string"
            ? loc.name
            : "";

    const state =
        typeof loc.state === "string"
            ? loc.state
            : city;

    const display =
        typeof loc.display === "string"
            ? loc.display
            : typeof loc.formattedAddress === "string"
            ? loc.formattedAddress
            : typeof loc.address === "string"
            ? loc.address
            : city;

    const locationId = resolveCanonicalLocationId(raw);

    let coordinates: GeoJSONPoint | undefined;

    try {
        coordinates = normalizeGeoPoint(loc.coordinates ?? loc);
    } catch {
        coordinates = undefined;
    }

    return {
        display,
        city,
        state,
        country:
            typeof loc.country === "string" ? loc.country : "India",
        locationId,
        coordinates
    };
}
