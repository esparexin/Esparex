import type { AppLocation, AppLocationSource, GeoJSONPoint } from "@/types/location";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import {
    reverseGeocode as reverseGeocodeApi,
} from "@/lib/api/user/locations";
import { detectLocationByIP } from "@/lib/api/ipGeolocation";
import {
    createPoint,
    toCanonicalGeoPoint,
} from "@/lib/location/coordinates";
import {
    getDisplayLocationLabel,
    getHeaderLocationText,
    getSearchLocationLabel,
    isGenericDetectedLocation,
    normalizeLocationText,
    sanitizeLocationLabel,
    LABEL_CURRENT_LOCATION,
    LABEL_CURRENT_LOCATION_CAPTURED,
} from "@/lib/location/locationLabels";

const GEOLOCATION_TIMEOUT_MS = 12000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeSource = (value: unknown): AppLocationSource => {
    if (value === "auto" || value === "ip" || value === "manual" || value === "default") {
        return value;
    }
    return "manual";
};

function buildAppLocation(params: {
    formattedAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    coordinates?: GeoJSONPoint;
    source?: AppLocationSource;
    locationId?: string;
    name?: string;
    level?: AppLocation["level"];
}): AppLocation {
    const source = params.source ?? "manual";
    const city = params.city || DEFAULT_APP_LOCATION.city;
    const state = params.state || DEFAULT_APP_LOCATION.state;
    const country = params.country || DEFAULT_APP_LOCATION.country;
    const formattedAddress =
        params.formattedAddress ||
        params.name ||
        city ||
        DEFAULT_APP_LOCATION.formattedAddress;

    const locationId = params.locationId;
    const now = Date.now();

    return {
        formattedAddress,
        city,
        state,
        country,
        pincode: params.pincode,
        source,
        locationId,
        level: params.level,
        id: locationId,
        display: formattedAddress,
        coordinates: params.coordinates,
        detectedAt: now,
        isAuto: source === "auto",
    };
}

export function normalizeToAppLocation(
    rawLocation: unknown,
    sourceOverride?: AppLocationSource
): AppLocation | null {
    if (!rawLocation) return null;

    if (typeof rawLocation === "string") {
        const value = rawLocation.trim();
        if (!value) return null;
        const parts = value.split(",");
        const city = parts[0]?.trim() || value;
        const state = parts[1]?.trim() || city;
        return buildAppLocation({
            formattedAddress: value,
            city,
            state,
            source: sourceOverride ?? "manual",
            name: city,
        });
    }

    if (!isRecord(rawLocation)) return null;

    const coordinates =
        toCanonicalGeoPoint(rawLocation.coordinates) ||
        toCanonicalGeoPoint(rawLocation.location) ||
        toCanonicalGeoPoint(rawLocation);

    const city =
        (typeof rawLocation.city === "string" && rawLocation.city) ||
        (typeof rawLocation.name === "string" && rawLocation.name) ||
        "";

    const state =
        (typeof rawLocation.state === "string" && rawLocation.state) || city;
    const country =
        (typeof rawLocation.country === "string" && rawLocation.country) ||
        DEFAULT_APP_LOCATION.country;

    const formattedAddress =
        (typeof rawLocation.formattedAddress === "string" &&
            rawLocation.formattedAddress) ||
        (typeof rawLocation.display === "string" && rawLocation.display) ||
        (typeof rawLocation.address === "string" && rawLocation.address) ||
        (typeof rawLocation.name === "string" && rawLocation.name) ||
        city;

    const locationId =
        (typeof rawLocation.locationId === "string" && rawLocation.locationId) ||
        (typeof rawLocation.id === "string" && rawLocation.id) ||
        undefined;

    const source = sourceOverride ?? normalizeSource(rawLocation.source);
    const pincode =
        typeof rawLocation.pincode === "string" ? rawLocation.pincode : undefined;
    const level =
        rawLocation.level === "country" ||
            rawLocation.level === "state" ||
            rawLocation.level === "district" ||
            rawLocation.level === "city" ||
            rawLocation.level === "area" ||
            rawLocation.level === "village"
            ? rawLocation.level
            : undefined;

    return buildAppLocation({
        formattedAddress,
        city,
        state,
        country,
        pincode,
        coordinates,
        source,
        locationId,
        level,
        name:
            (typeof rawLocation.name === "string" && rawLocation.name) || city,
    });
}

export async function reverseGeocode(
    latitude: number,
    longitude: number
): Promise<AppLocation | null> {
    const location = await reverseGeocodeApi(latitude, longitude);
    if (!location) return null;
    return normalizeToAppLocation(location, "auto");
}

export type CurrentLocationMode = "precise";

type CurrentLocationOptions = {
    mode?: CurrentLocationMode;
};

export type LocationDetectFailureReason =
    | "permission_denied"
    | "position_unavailable"
    | "timeout"
    | "unsupported"
    | "insecure_context"
    | "prompt_skipped"
    | "unknown";

export type LocationDetectFailure = {
    reason: LocationDetectFailureReason;
    message: string;
};

export type LocationDetectResult = {
    location: AppLocation | null;
    source: "auto" | "ip" | "none";
    failure?: LocationDetectFailure;
};

const mapGeolocationError = (error: unknown): LocationDetectFailure => {
    const code = isRecord(error) && typeof error.code === "number" ? error.code : null;
    if (code === 1) {
        return {
            reason: "permission_denied",
            message:
                "Location permission denied. Allow location access in your browser settings and try again.",
        };
    }
    if (code === 2) {
        return {
            reason: "position_unavailable",
            message: "Location unavailable. Check GPS or network and try again.",
        };
    }
    if (code === 3) {
        return {
            reason: "timeout",
            message: "Location request timed out. Please try again.",
        };
    }
    return {
        reason: "unknown",
        message: "Unable to detect location right now. Please try again.",
    };
};

const isSecureLocationContext = (): boolean => {
    if (typeof window === "undefined") return false;
    if (window.isSecureContext) return true;
    return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname);
};

/**
 * Auto-detect location using the canonical reverse-geocode path only.
 * The location ingest endpoint is admin-only and intentionally not used by the user app.
 */
const autoDetectLocation = async (
    latitude: number,
    longitude: number
): Promise<AppLocation | null> => {
    const existing = await reverseGeocodeApi(latitude, longitude);
    if (existing) {
        return normalizeToAppLocation(existing, "auto");
    }

    return null;
};

const buildFailureResult = (
    failure: LocationDetectFailure
): LocationDetectResult => ({
    location: null,
    source: "none",
    failure,
});

const detectApproximateLocationByIP = async (): Promise<LocationDetectResult | null> => {
    const detected = await detectLocationByIP();
    if (!detected?.city || !detected.coordinates) {
        return null;
    }

    const formattedAddress = [detected.city, detected.state, detected.country]
        .filter((value) => typeof value === "string" && value.trim().length > 0)
        .join(", ");

    return {
        location: buildAppLocation({
            formattedAddress: formattedAddress || "Approximate current location",
            city: detected.city,
            state: detected.state,
            country: detected.country,
            coordinates: detected.coordinates,
            source: "ip",
            name: detected.city,
        }),
        source: "ip",
    };
};

const detectPreciseLocation = async (): Promise<LocationDetectResult> => {
    if (typeof window === "undefined") {
        return buildFailureResult({
            reason: "unsupported",
            message: "Location detection is unavailable on the server.",
        });
    }

    if (!isSecureLocationContext()) {
        const approximate = await detectApproximateLocationByIP();
        if (approximate) {
            return approximate;
        }

        return buildFailureResult({
            reason: "insecure_context",
            message:
                "Location permission is blocked on insecure pages. Use HTTPS or localhost.",
        });
    }

    if (!navigator.geolocation) {
        const approximate = await detectApproximateLocationByIP();
        if (approximate) {
            return approximate;
        }

        return buildFailureResult({
            reason: "unsupported",
            message: "Geolocation is not supported by this browser.",
        });
    }

    let permissionState: PermissionState | "unknown" = "unknown";
    try {
        if ("permissions" in navigator && navigator.permissions?.query) {
            const result = await navigator.permissions.query({ name: "geolocation" });
            permissionState = result.state;
        }
    } catch {
        permissionState = "unknown";
    }

    if (permissionState === "denied") {
        return buildFailureResult({
            reason: "permission_denied",
            message:
                "Location permission denied. Allow location access in your browser settings and try again.",
        });
    }

    try {
        const coords = await new Promise<GeolocationCoordinates>(
            (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve(position.coords),
                    reject,
                    {
                        enableHighAccuracy: false,
                        timeout: GEOLOCATION_TIMEOUT_MS,
                        maximumAge: 300000, // 5 min cache — avoids redundant GPS re-acquire
                    }
                );
            }
        );

        const resolved = await autoDetectLocation(
            coords.latitude,
            coords.longitude
        );
        if (resolved) {
            return {
                location: resolved,
                source: "auto",
            };
        }

        return {
            location: buildAppLocation({
                formattedAddress: LABEL_CURRENT_LOCATION_CAPTURED,
                city: LABEL_CURRENT_LOCATION,
                state: "",
                country: "Unknown",
                coordinates: createPoint(coords.longitude, coords.latitude),
                source: "auto",
                name: LABEL_CURRENT_LOCATION,
            }),
            source: "auto",
        };
    } catch (error) {
        const failure = mapGeolocationError(error);
        if (failure.reason !== "permission_denied") {
            const approximate = await detectApproximateLocationByIP();
            if (approximate) {
                return approximate;
            }
        }

        return buildFailureResult(failure);
    }
};

async function getCurrentLocationWithOptions(
    _options: CurrentLocationOptions = {}
): Promise<LocationDetectResult> {
    return detectPreciseLocation();
}

export async function getCurrentLocationResult(
    options: CurrentLocationOptions = {}
): Promise<LocationDetectResult> {
    return getCurrentLocationWithOptions(options);
}

export function normalizeLocationName(name: string | undefined | null): string {
    // Display-only formatter.
    // Must not be used in backend/search query construction to avoid
    // altering canonical lookup behavior for diacritic-sensitive names.
    return normalizeLocationText(name);
}

type LocationLike = {
    display?: string;
    city?: string;
    name?: string;
} | string | null | undefined;

export function formatLocation(location: LocationLike): string {
    if (!location) return "";
    if (typeof location === "string") return sanitizeLocationLabel(location) || "";
    
    // Prioritize City for brief "brief" indicators (e.g. Ad Cards).
    // The "display" field often contains full addresses which causes grid inconsistency.
    if (location.city) return sanitizeLocationLabel(location.city) || "";
    if (location.display) return sanitizeLocationLabel(location.display) || "";
    if (location.name) return sanitizeLocationLabel(location.name) || "";

    return "";
}

export {
    getDisplayLocationLabel,
    getHeaderLocationText,
    getSearchLocationLabel,
    isGenericDetectedLocation,
    sanitizeLocationLabel,
};
