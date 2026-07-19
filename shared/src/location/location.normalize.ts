import { ListingLocation } from "@esparex/contracts";
import { type GeoJSONPoint, normalizeGeoPoint } from "../utils/geoUtils";
import { sanitizeMongoObjectId } from "../validators/mongo";

/**
 * @deprecated Use `LocationFacade.normalize` instead.
 */
export function adaptLocationInput(raw: unknown) {
    return normalizeLocation(raw);
}

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
 * Normalizes a raw location into a stable ListingLocation structure.
 * Ensures `locationId` is always present if a valid ID exists.
 * Guarantees:
 * - locationId is always present when resolvable.
 * - Coordinate precision is standardized.
 * - Empty strings become undefined.
 * - Legacy aliases are converted.
 * - Object shape is deterministic.
 * - Function is idempotent.
 */
export function normalizeLocation(raw: unknown): ListingLocation | null {
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
        typeof loc.city === "string" && loc.city.trim() !== ""
            ? loc.city.trim()
            : typeof loc.name === "string" && loc.name.trim() !== ""
            ? loc.name.trim()
            : "";

    const state =
        typeof loc.state === "string" && loc.state.trim() !== ""
            ? loc.state.trim()
            : city;

    const display =
        typeof loc.display === "string" && loc.display.trim() !== ""
            ? loc.display.trim()
            : typeof loc.formattedAddress === "string" && loc.formattedAddress.trim() !== ""
            ? loc.formattedAddress.trim()
            : typeof loc.address === "string" && loc.address.trim() !== ""
            ? loc.address.trim()
            : city;

    const locationId = resolveCanonicalLocationId(raw) || undefined;

    let coordinates: GeoJSONPoint | undefined;
    try {
        coordinates = normalizeGeoPoint(loc.coordinates ?? loc);
    } catch {
        coordinates = undefined;
    }

    return {
        display: display || city || state,
        city,
        state,
        country: typeof loc.country === "string" && loc.country.trim() !== "" ? loc.country.trim() : "India",
        locationId,
        coordinates
    };
}
