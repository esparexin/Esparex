import { toGeoPoint as parseGeoPoint } from "@shared/utils/geoUtils";
import type { Location } from "@/api/user/locations";

export type ErrorType = "network" | "timeout" | "server" | "not_found" | "unknown";
export type SelectorVariant = "inline" | "panel";

export interface LocationError {
    type: ErrorType;
    message: string;
    retryable: boolean;
}

export const MAX_DROPDOWN_RESULTS = 10;
export const SEARCH_DEBOUNCE_MS = 200;

export const ERROR_MESSAGES: Record<ErrorType, string> = {
    network: "No internet connection. Please check your network.",
    timeout: "Search is taking longer than usual. Please try again.",
    server: "Our servers are busy. Please try again in a moment.",
    not_found: "No locations found. Try a different search.",
    unknown: "Something went wrong. Please try again.",
};

export const toGeoPoint = (coords: unknown): { type: "Point"; coordinates: [number, number] } | undefined => {
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
