import type { AppLocation, AppLocationSource, GeoJSONPoint } from "@/types/location";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import {
    reverseGeocode as reverseGeocodeApi,
    ingestLocation as ingestLocationApi,
} from "@/api/user/locations";
import { detectLocationByIP } from "@/services/ipGeolocation";
import {
    createPoint,
    toCanonicalGeoPoint,
} from "@/lib/location/coordinates";

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
    placeId?: string;
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

    const placeId = params.placeId;
    const now = Date.now();

    return {
        formattedAddress,
        city,
        state,
        country,
        pincode: params.pincode,
        source,
        locationId: placeId,
        placeId,
        level: params.level,
        id: placeId,
        display: formattedAddress,
        coordinates: params.coordinates,
        detectedAt: now,
        isAuto: source === "auto",
    };
}

export function normalizeLocation(
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

    const placeId =
        (typeof rawLocation.placeId === "string" && rawLocation.placeId) ||
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
        placeId,
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
    return normalizeLocation(location, "auto");
}

type CurrentLocationOptions = {
    allowIpFallback?: boolean;
    allowGeolocationPrompt?: boolean;
    skipGeolocation?: boolean;
};

export type LocationDetectFailureReason =
    | "permission_denied"
    | "position_unavailable"
    | "timeout"
    | "unsupported"
    | "insecure_context"
    | "prompt_skipped"
    | "ip_failed"
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

const reverseGeocodeWithSource = async (
    latitude: number,
    longitude: number,
    source: AppLocationSource
): Promise<AppLocation | null> => {
    const location = await reverseGeocodeApi(latitude, longitude);
    if (!location) return null;
    return normalizeLocation(location, source);
};

/**
 * Auto-detect location: reverse geocode, then auto-create if not found
 * Used specifically for the auto-detect feature to ensure we always have a location record
 */
const autoDetectLocationWithAutoCreate = async (
    latitude: number,
    longitude: number
): Promise<AppLocation | null> => {
    // Try reverse geocoding first
    const existing = await reverseGeocodeApi(latitude, longitude);
    if (existing) {
        return normalizeLocation(existing, "auto");
    }

    // If not found, try to create it
    try {
        const created = await ingestLocationApi({
            coordinates: {
                type: "Point",
                coordinates: [longitude, latitude],
            },
            name: "",
            city: "",
            state: "",
            country: "Unknown",
            // Server will reverse geocode the address from coordinates
        });

        if (created) {
            return normalizeLocation(created, "auto");
        }
    } catch {
        // If auto-create fails, fall back to fallback location
        // (server-side ingestLocation already checks for duplicates and creates if needed)
    }

    return null;
};

async function getCurrentLocationWithOptions(
    options: CurrentLocationOptions = {}
): Promise<LocationDetectResult> {
    if (typeof window === "undefined") {
        return {
            location: null,
            source: "none",
            failure: {
                reason: "unsupported",
                message: "Location detection is unavailable on the server.",
            },
        };
    }

    const allowIpFallback = options.allowIpFallback ?? true;
    const allowGeolocationPrompt = options.allowGeolocationPrompt ?? true;
    const skipGeolocation = options.skipGeolocation ?? false;
    let geolocationFailure: LocationDetectFailure | undefined;

    if (skipGeolocation) {
        geolocationFailure = {
            reason: "prompt_skipped",
            message: "Using approximate location by request.",
        };
    } else if (!isSecureLocationContext()) {
        geolocationFailure = {
            reason: "insecure_context",
            message:
                "Location permission is blocked on insecure pages. Use HTTPS or localhost.",
        };
    }

    if (navigator.geolocation && !geolocationFailure) {
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
            geolocationFailure = {
                reason: "permission_denied",
                message:
                    "Location permission denied. Allow location access in your browser settings and try again.",
            };
        }

        if (!geolocationFailure && !allowGeolocationPrompt && permissionState !== "granted") {
            geolocationFailure = {
                reason: "prompt_skipped",
                message: "Using approximate location to avoid interrupting current flow.",
            };
        }

        if (!geolocationFailure) {
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

                const resolved = await autoDetectLocationWithAutoCreate(
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
                        formattedAddress: "Current Location",
                        city: "Current Location",
                        state: "Unknown",
                        country: "Unknown",
                        coordinates: createPoint(coords.longitude, coords.latitude),
                        source: "auto",
                        name: "Current Location",
                    }),
                    source: "auto",
                };
            } catch (error) {
                geolocationFailure = mapGeolocationError(error);
            }
        }
    } else if (!navigator.geolocation) {
        geolocationFailure = {
            reason: "unsupported",
            message: "Geolocation is not supported by this browser.",
        };
    }

    if (!allowIpFallback) {
        return {
            location: null,
            source: "none",
            failure: geolocationFailure || {
                reason: "unknown",
                message: "Unable to detect location.",
            },
        };
    }

    const ipLocation = await detectLocationByIP();
    if (!ipLocation) {
        return {
            location: null,
            source: "none",
            failure: geolocationFailure || {
                reason: "ip_failed",
                message:
                    "Unable to detect location automatically. Please select location manually.",
            },
        };
    }

    const ipLng = ipLocation.coordinates.coordinates[0];
    const ipLat = ipLocation.coordinates.coordinates[1];

    const resolved = await reverseGeocodeWithSource(
        ipLat,
        ipLng,
        "ip"
    );
    if (resolved) {
        return {
            location: resolved,
            source: "ip",
        };
    }

    return {
        location: buildAppLocation({
            formattedAddress: `${ipLocation.city}, ${ipLocation.state}`,
            city: ipLocation.city,
            state: ipLocation.state,
            country: ipLocation.country,
            coordinates: createPoint(ipLng, ipLat),
            source: "ip",
            name: ipLocation.city,
        }),
        source: "ip",
    };
}

export async function getCurrentLocationResult(
    options: CurrentLocationOptions = {}
): Promise<LocationDetectResult> {
    return getCurrentLocationWithOptions(options);
}

export function toLocationPayload(location: AppLocation): {
    locationId?: string;
    city: string;
    state: string;
    country: string;
    display: string;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    };
} {
    const locationId = location.locationId || location.placeId || location.id;
    return {
        locationId,
        city: location.city,
        state: location.state,
        country: location.country,
        display: location.formattedAddress,
        coordinates: toCanonicalGeoPoint(location.coordinates),
    };
}

export function normalizeLocationName(name: string | undefined | null): string {
    // Display-only formatter.
    // Must not be used in backend/search query construction to avoid
    // altering canonical lookup behavior for diacritic-sensitive names.
    if (!name) return "";

    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function getHeaderLocationText(location: {
    name?: string;
    formattedAddress?: string;
    city?: string;
    level?: "area" | "city" | "district" | "state" | "country" | "village" | string;
    source?: "auto" | "ip" | "manual" | "default" | string;
}) {
    const normalizedName = normalizeLocationName(
        location.name || location.formattedAddress || location.city
    );

    const headerText = location.source === "default" ? "Select Location" : normalizedName;

    return {
        headerText,
        tooltipText: normalizedName,
        meta:
            location.source === "auto"
                ? "Auto-detected"
                : location.source === "ip"
                    ? "Approximate (IP)"
                    : location.source === "manual"
                        ? "Selected manually"
                        : "Nationwide results",
    };
}

type LocationLike = {
    display?: string;
    city?: string;
    name?: string;
} | string | null | undefined;

type LocationDisplayLike =
    | {
        display?: string;
        formattedAddress?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
    }
    | string
    | null
    | undefined;

export function formatLocation(location: LocationLike): string {
    if (!location) return "";
    if (typeof location === "string") return location;
    if (location.display) return normalizeLocationName(location.display);
    if (location.city) return normalizeLocationName(location.city);
    if (location.name) return normalizeLocationName(location.name);

    return "";
}

export function formatLocationDisplay(location: LocationDisplayLike): string {
    if (!location) return "";
    if (typeof location === "string") return normalizeLocationName(location);

    const primary = formatLocation(location);
    if (primary) return primary;

    return [location.city, location.state, location.country]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => normalizeLocationName(value))
        .join(", ");
}

export function isNeutralLocation(location: LocationLike): boolean {
    if (!location) return true;
    const name = typeof location === 'string' ? location : (location.name || location.city || "");
    return name === "Select Location" || name === "Unknown" || !name;
}

export function extractCityFromLocation(location: string): string {
    const parts = location.split(",");
    return parts[0]?.trim() || "";
}
