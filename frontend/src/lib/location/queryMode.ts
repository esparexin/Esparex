import type { AppLocation, LocationLevel } from "@/types/location";
import { getLatitude, getLongitude } from "@/lib/location/utils";

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

    return getLatitude(location) != null && getLongitude(location) != null;
}
