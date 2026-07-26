import type { AppLocation, LocationLevel } from "@/types/location";
import { getLatitude, getLongitude } from "@esparex/shared";
type QueryLocation = Partial<Pick<AppLocation, "source" | "locationId" | "level" | "coordinates">> | null | undefined;

export function isRegionLocationLevel(level?: LocationLevel | string): boolean {
    return level === "state" || level === "country";
}

export function hasCanonicalLocationId(location: QueryLocation): boolean {
    return typeof location?.locationId === "string" && location.locationId.trim().length > 0;
}

export function shouldUseExactLocationHierarchy(location: QueryLocation): boolean {
    return Boolean(location?.source === "manual" && hasCanonicalLocationId(location));
}

export function shouldUseGeoRadiusLocation(location: QueryLocation): boolean {
    if (!location || isRegionLocationLevel(location.level)) return false;
    if (shouldUseExactLocationHierarchy(location)) return false;

    return getLatitude(location) != undefined && getLongitude(location) != undefined;
}

/**
 * Helper to determine if the location context represents a user-selected location
 * (either explicitly chosen or GPS granted) rather than the default fallback.
 */
export function isUserSelectedLocation(location: QueryLocation): boolean {
    return Boolean(
        location &&
        location.source !== "default" &&
        (hasCanonicalLocationId(location) ||
            (getLatitude(location) !== undefined && getLongitude(location) !== undefined))
    );
}

/**
 * Helper to determine if location-based filtering should be applied.
 * Eligible only if there is a URL override OR the user has selected a location.
 */
export function shouldApplyLocationFilter(location: QueryLocation, urlLocationId?: string): boolean {
    return Boolean(urlLocationId) || isUserSelectedLocation(location);
}

