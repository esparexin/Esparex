/**
 * locationNormalizer.ts
 * Pure data transforms: normalizeToAppLocation, reverseGeocode, formatLocation.
 * No browser APIs. Safe to import in SSR and tests.
 */

import type { AppLocation, AppLocationSource, GeoJSONPoint } from "@/types/location";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import { reverseGeocode as reverseGeocodeApi } from "@/lib/api/user/locations";
import { toCanonicalGeoPoint } from "@esparex/shared";
import {
    normalizeLocationText,
    sanitizeLocationLabel,
} from "@/lib/location/locationLabels";

// ── internal helpers ─────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== undefined && !Array.isArray(value);

const normalizeSource = (value: unknown): AppLocationSource => {
    if (value === "auto" || value === "ip" || value === "manual" || value === "default") {
        return value;
    }
    return "manual";
};

export function buildAppLocation(params: {
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
    isSnapped?: boolean;
}): AppLocation {
    const source = params.source ?? "manual";
    const city = params.city || DEFAULT_APP_LOCATION.city;
    const state = params.state || DEFAULT_APP_LOCATION.state;
    const country = params.country || DEFAULT_APP_LOCATION.country;
    const formattedAddress =
        params.formattedAddress ||
        params.name ||
        (city && state ? `${city}, ${state}` : city) ||
        (state ? `${state}, ${country}` : country !== "India" ? country : "");

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
        isSnapped: params.isSnapped,
    };
}

// ── public API ────────────────────────────────────────────────────────────────

export function normalizeToAppLocation(
    rawLocation: unknown,
    sourceOverride?: AppLocationSource,
): AppLocation | null {
    if (!rawLocation) return null;

    if (typeof rawLocation === "string") {
        const value = rawLocation.trim();
        if (!value) return null;
        const parts = value.split(",");
        const city = parts[0]?.trim() || value;
        const state = parts[1]?.trim() || "";
        return buildAppLocation({ formattedAddress: value, city, state, source: sourceOverride ?? "manual", name: city });
    }

    if (!isRecord(rawLocation)) return null;

    const coordinates =
        toCanonicalGeoPoint(rawLocation.coordinates) ||
        toCanonicalGeoPoint(rawLocation.location) ||
        toCanonicalGeoPoint(rawLocation);

    const city =
        (typeof rawLocation.city === "string" && rawLocation.city) ||
        (typeof rawLocation.name === "string" && rawLocation.name) || "";
    const state = (typeof rawLocation.state === "string" && rawLocation.state) || "";
    const country =
        (typeof rawLocation.country === "string" && rawLocation.country) || DEFAULT_APP_LOCATION.country;
    const formattedAddress =
        (typeof rawLocation.formattedAddress === "string" && rawLocation.formattedAddress) ||
        (typeof rawLocation.display === "string" && rawLocation.display) ||
        (typeof rawLocation.address === "string" && rawLocation.address) ||
        (typeof rawLocation.name === "string" && rawLocation.name) || city;
    const locationId =
        (typeof rawLocation.locationId === "string" && rawLocation.locationId) ||
        (typeof rawLocation.id === "string" && rawLocation.id) || undefined;
    const source = sourceOverride ?? normalizeSource(rawLocation.source);
    const pincode = typeof rawLocation.pincode === "string" ? rawLocation.pincode : undefined;
    const level =
        rawLocation.level === "country" || rawLocation.level === "state" ||
        rawLocation.level === "district" || rawLocation.level === "city" ||
        rawLocation.level === "area" || rawLocation.level === "village"
            ? rawLocation.level : undefined;
    const isSnapped = typeof rawLocation.isSnapped === "boolean" ? rawLocation.isSnapped : undefined;

    return buildAppLocation({
        formattedAddress, city, state, country, pincode, coordinates,
        source, locationId, level, isSnapped,
        name: (typeof rawLocation.name === "string" && rawLocation.name) || city,
    });
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<AppLocation | null> {
    const location = await reverseGeocodeApi(latitude, longitude);
    if (!location) return null;
    return normalizeToAppLocation(location, "auto");
}

export function normalizeLocationName(name: string | undefined | null): string {
    return normalizeLocationText(name);
}

type LocationLike = { display?: string; city?: string; name?: string } | string | null | undefined;

export function formatLocation(location: LocationLike): string {
    if (!location) return "";
    if (typeof location === "string") return sanitizeLocationLabel(location) || "";
    if (location.city) return sanitizeLocationLabel(location.city) || "";
    if (location.display) return sanitizeLocationLabel(location.display) || "";
    if (location.name) return sanitizeLocationLabel(location.name) || "";
    return "";
}
