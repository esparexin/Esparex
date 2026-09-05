/**
 * locationDetection.ts
 * Browser GPS detection generator, IP geolocation fallback, state machine types.
 * Requires browser APIs — not safe for SSR imports.
 */

import { detectLocationByIP } from "@/lib/api/ipGeolocation";
import { buildAppLocation, reverseGeocode } from "./locationNormalizer";
import type { AppLocation } from "@/types/location";

// ── types ────────────────────────────────────────────────────────────────────

export type LocationDetectFailureReason =
    | "permission_denied"
    | "position_unavailable"
    | "timeout"
    | "unsupported"
    | "insecure_context"
    | "prompt_skipped"
    | "unknown";

export type LocationDetectFailure = { reason: LocationDetectFailureReason; message: string };

export type LocationDetectResult = {
    location: AppLocation | null;
    source: "auto" | "ip" | "none";
    failure?: LocationDetectFailure;
};

export type LocationDetectionState =
    | "idle" | "checking_permission" | "requesting_gps" | "gps_acquired"
    | "reverse_geocoding" | "location_resolved" | "permission_denied"
    | "gps_timeout" | "reverse_geocode_failed" | "network_error";

export const LOCATION_STATE_MESSAGES: Record<LocationDetectionState, string> = {
    idle: "Detect My Location",
    checking_permission: "Checking location permission...",
    requesting_gps: "Requesting GPS access...",
    gps_acquired: "GPS location acquired...",
    reverse_geocoding: "Finding your nearest city...",
    location_resolved: "Location detected",
    permission_denied: "Location permission denied",
    gps_timeout: "GPS request timed out",
    reverse_geocode_failed: "Unable to determine your location",
    network_error: "Unable to connect to location service",
};

// ── internal helpers ─────────────────────────────────────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== undefined && !Array.isArray(v);

const mapGeolocationError = (error: unknown): LocationDetectFailure => {
    const code = isRecord(error) && typeof error.code === "number" ? error.code : null;
    if (code === 1) return { reason: "permission_denied", message: "Location permission denied. Allow location access in your browser settings and try again." };
    if (code === 2) return { reason: "position_unavailable", message: "Location unavailable. Check GPS or network and try again." };
    if (code === 3) return { reason: "timeout", message: "Location request timed out. Please try again." };
    return { reason: "unknown", message: "Unable to detect location right now. Please try again." };
};

const isSecureLocationContext = (): boolean => {
    if (typeof window === "undefined") return false;
    if (window.isSecureContext) return true;
    return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname);
};

const buildFailureResult = (failure: LocationDetectFailure): LocationDetectResult =>
    ({ location: null, source: "none", failure });

const detectApproximateLocationByIP = async (): Promise<LocationDetectResult | null> => {
    const detected = await detectLocationByIP();
    if (!detected?.city || !detected.coordinates) return null;
    const formattedAddress = [detected.city, detected.state, detected.country]
        .filter((v) => typeof v === "string" && v.trim().length > 0)
        .join(", ");
    return {
        location: buildAppLocation({
            formattedAddress: formattedAddress || "Approximate current location",
            city: detected.city, state: detected.state, country: detected.country,
            coordinates: detected.coordinates, source: "ip", name: detected.city,
        }),
        source: "ip",
    };
};

// ── public API ────────────────────────────────────────────────────────────────

type CurrentLocationOptions = {
    allowApproximateFallback?: boolean;
    timeoutMs?: number;
    maximumAgeMs?: number;
    enableHighAccuracy?: boolean;
};

async function resolveCoordsToLocation(coords: GeolocationCoordinates): Promise<AppLocation | null> {
    return reverseGeocode(coords.latitude, coords.longitude);
}

export async function* detectPreciseLocationGenerator(
    options: CurrentLocationOptions = {},
): AsyncGenerator<LocationDetectionState, LocationDetectResult, void> {
    const { allowApproximateFallback = true, timeoutMs = 20000, maximumAgeMs = 0, enableHighAccuracy = true } = options;

    yield "checking_permission";

    if (!isSecureLocationContext()) {
        yield "permission_denied";
        const approximate = allowApproximateFallback ? await detectApproximateLocationByIP() : null;
        if (approximate) return approximate;
        return buildFailureResult({ reason: "insecure_context", message: "Location permission is blocked on insecure pages. Use HTTPS or localhost." });
    }

    if (!navigator.geolocation) {
        yield "permission_denied";
        const approximate = allowApproximateFallback ? await detectApproximateLocationByIP() : null;
        if (approximate) return approximate;
        return buildFailureResult({ reason: "unsupported", message: "Geolocation is not supported by this browser." });
    }

    const MAX_ATTEMPTS = 3;
    let lastError: unknown = undefined;
    let lastFailureReason: LocationDetectFailureReason = "unknown";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            yield "requesting_gps";
            const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve(position.coords),
                    reject,
                    { enableHighAccuracy, timeout: timeoutMs, maximumAge: attempt === 1 ? maximumAgeMs : 0 },
                );
            });

            yield "gps_acquired";
            yield "reverse_geocoding";
            const location = await resolveCoordsToLocation(coords);
            if (location) {
                yield "location_resolved";
                return { location, source: "auto" };
            }
            yield "reverse_geocode_failed";
            lastFailureReason = "position_unavailable";
            break;
        } catch (error) {
            lastError = error;
            const failure = mapGeolocationError(error);
            lastFailureReason = failure.reason;
            const isTransient = failure.reason === "position_unavailable" || failure.reason === "timeout";
            if (!isTransient || attempt === MAX_ATTEMPTS) break;
            await new Promise(r => setTimeout(r, 400 * Math.pow(2, attempt)));
        }
    }

    // Low-accuracy WiFi fallback for position_unavailable
    if (lastFailureReason === "position_unavailable" && enableHighAccuracy) {
        try {
            yield "requesting_gps";
            const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve(position.coords),
                    reject,
                    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
                );
            });
            yield "gps_acquired";
            yield "reverse_geocoding";
            const location = await resolveCoordsToLocation(coords);
            if (location) {
                yield "location_resolved";
                return { location, source: "auto" };
            }
            yield "reverse_geocode_failed";
        } catch { /* fall through to IP detection */ }
    }

    const failure = lastError
        ? mapGeolocationError(lastError)
        : {
            reason: "position_unavailable" as const,
            message: "Unable to determine settlement for your GPS position.",
        };

    if (failure.reason === "permission_denied") yield "permission_denied";
    else if (failure.reason === "timeout") yield "gps_timeout";
    else if (lastFailureReason === "position_unavailable") yield "reverse_geocode_failed";
    else yield "network_error";

    if (allowApproximateFallback && failure.reason !== "permission_denied") {
        const approximate = await detectApproximateLocationByIP();
        if (approximate) { yield "location_resolved"; return approximate; }
    }

    return buildFailureResult(failure);
}

export async function getCurrentLocationResult(options: CurrentLocationOptions = {}): Promise<LocationDetectResult> {
    const generator = detectPreciseLocationGenerator(options);
    let finalResult: LocationDetectResult | undefined;
    while (true) {
        const { value, done } = await generator.next();
        if (done) { finalResult = value as LocationDetectResult; break; }
    }
    return finalResult;
}
