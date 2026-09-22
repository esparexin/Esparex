import { normalizeGeoPoint as parseGeoPoint, toCanonicalGeoPoint } from "@esparex/shared";
import type { Location } from "@/lib/api/user/locations";
import { normalizeLocationName } from "@/lib/location/locationService";

export type ErrorType = "network" | "timeout" | "server" | "not_found" | "unknown";
export type SelectorVariant = "inline" | "panel";

export interface LocationError {
    type: ErrorType;
    message: string;
    retryable: boolean;
}

export const MAX_DROPDOWN_RESULTS = 6;
export const SEARCH_DEBOUNCE_MS = 200;

export const ERROR_MESSAGES: Record<ErrorType, string> = {
    network: "No internet connection. Please check your network.",
    timeout: "Search is taking longer than usual. Please try again.",
    server: "Our servers are busy. Please try again in a moment.",
    not_found: "No locations found. Try a different search.",
    unknown: "Unable to resolve location. Please select your location manually.",
};

export const normalizeGeoPoint = (coords: unknown): { type: "Point"; coordinates: [number, number] } | undefined => {
    try {
        const point = parseGeoPoint(coords);
        const [lng, lat] = point.coordinates;
        if (lat === 0 && lng === 0) return undefined;
        return point;
    } catch {
        return undefined;
    }
};

export type DetectedLocationShape = Partial<Location> & {
    formattedAddress?: string;
};

export const toDetectedSelection = (detected: DetectedLocationShape): Location | null => {
    if (!detected.coordinates) return null;

    const detectedId =
        detected.locationId ||
        detected.id ||
        [detected.city, detected.state]
            .filter(Boolean)
            .join("-")
            .toLowerCase()
            .replace(/\s+/g, "-");

    const detectedDisplay =
        detected.display ||
        detected.formattedAddress ||
        detected.name ||
        detected.city;

    return {
        id: detectedId,
        locationId: detectedId,
        slug: detectedId,
        city: detected.city,
        state: detected.state,
        country: detected.country,
        name: detected.name || detected.city,
        display: detectedDisplay,
        displayName: detectedDisplay,
        level: detected.level ?? "city",
        coordinates: detected.coordinates,
        isActive: true,
        isPopular: false,
    } as Location;
};

export const getLocationPrimaryLabel = (loc: Location): string => (
    normalizeLocationName(loc.name || loc.city || loc.display || "")
);

export const getLocationSecondaryLabel = (loc: Location): string => {
    const parts = [loc.city, loc.state]
        .map((value) => normalizeLocationName(value))
        .filter(Boolean);

    if (parts.length === 2 && parts[0] === parts[1]) {
        return loc.country ? normalizeLocationName(loc.country) : "";
    }

    return parts.join(", ");
};

export const toFinalSelectedLocation = (loc: Location): Location => {
    const canonicalGeoJSONPoint = toCanonicalGeoPoint(loc.coordinates) || {
        type: "Point" as const,
        coordinates: [78.4867, 17.3850] as [number, number]
    };
    return {
        id: loc.locationId || loc.id || [loc.city || loc.name, loc.state].filter(Boolean).join("-").toLowerCase(),
        locationId: loc.locationId || loc.id || [loc.city || loc.name, loc.state].filter(Boolean).join("-").toLowerCase(),
        slug: loc.slug || [loc.city || loc.name, loc.state].filter(Boolean).join("-").toLowerCase(),
        city: loc.city || loc.name,
        state: loc.state || loc.city || loc.name,
        country: loc.country || "India",
        name: loc.name || loc.city,
        display: loc.display || loc.displayName || [loc.city || loc.name, loc.state].filter(Boolean).join(", "),
        displayName: loc.displayName || loc.name || loc.city,
        level: loc.level || "city",
        coordinates: canonicalGeoJSONPoint,
    } as Location;
};
