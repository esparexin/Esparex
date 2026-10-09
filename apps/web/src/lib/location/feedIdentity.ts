import { getLatitude, getLongitude, sanitizeMongoObjectId } from "@esparex/shared";
import type { AppLocation, LocationLevel } from "@/types/location";

/**
 * Feed-location identity & SSR cookie SSOT.
 * Client location lives in localStorage (client-only), so the persisted
 * location is mirrored into a lightweight `esparex_loc` cookie. The server
 * reads it to render an already-localized SSR feed, which the client reuses
 * (no refetch flash) when its location identity matches.
 */

/** Cookie carrying the persisted feed location for SSR alignment (non-sensitive preference). */
export const FEED_LOCATION_COOKIE_NAME = "esparex_loc";

const FEED_LOCATION_COOKIE_MAX_AGE = 31536000; // 1 year, mirrors localStorage durability

const LOCATION_LEVEL_VALUES: readonly LocationLevel[] = ["country", "state", "district", "city", "area", "village"];

export interface FeedLocationFields {
    locationId?: string;
    city?: string;
    level?: LocationLevel;
    lat?: number;
    lng?: number;
}

export interface FeedLocationIdentityInput {
    locationId?: unknown;
    id?: unknown;
    city?: unknown;
    level?: unknown;
    latitude?: unknown;
    longitude?: unknown;
}

const toFiniteNumber = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * Canonical feed identity shared by server (cookie fields) and client
 * (location context). Returns "default" unless a user location carrying a
 * canonical id or complete coordinates is declared.
 */
export function buildFeedLocationIdentity(
    input: FeedLocationIdentityInput | null | undefined,
    isUserLocation: boolean
): string {
    if (!isUserLocation || !input) return "default";
    const rawLocationId =
        (typeof input.locationId === "string" ? input.locationId : "") ||
        (typeof input.id === "string" ? input.id : "") ||
        "";
    const validLocationId = sanitizeMongoObjectId(rawLocationId) || "";
    const latitude = toFiniteNumber(input.latitude);
    const longitude = toFiniteNumber(input.longitude);
    if (!validLocationId && (latitude === undefined || longitude === undefined)) return "default";
    const city = typeof input.city === "string" ? input.city : "";
    const level = typeof input.level === "string" ? input.level : "";
    return [validLocationId, city, level, latitude?.toFixed(3) ?? "", longitude?.toFixed(3) ?? ""].join(":");
}

/** Serialize a context location for the SSR cookie. Null when nothing to persist. */
export function serializeFeedLocationCookie(location: AppLocation | null | undefined): string | null {
    if (!location || location.source === "default") return null;
    const validLocationId = sanitizeMongoObjectId(location.locationId || location.id || "") || undefined;
    const latitude = getLatitude(location);
    const longitude = getLongitude(location);
    if (!validLocationId && (typeof latitude !== "number" || typeof longitude !== "number")) return null;
    const fields: FeedLocationFields = {};
    if (validLocationId) fields.locationId = validLocationId;
    if (location.city) fields.city = location.city;
    if (location.level) fields.level = location.level;
    if (typeof latitude === "number") fields.lat = latitude;
    if (typeof longitude === "number") fields.lng = longitude;
    return JSON.stringify(fields);
}

/** Parse and validate the SSR cookie. Null when absent or unusable (caller falls back to default feed). */
export function parseFeedLocationCookie(value: string | undefined | null): FeedLocationFields | null {
    if (!value) return null;
    let raw: unknown;
    try {
        raw = JSON.parse(decodeURIComponent(value));
    } catch {
        try {
            raw = JSON.parse(value);
        } catch {
            return null;
        }
    }
    if (!raw || typeof raw !== "object") return null;
    const record = raw as Record<string, unknown>;
    const locationId = sanitizeMongoObjectId(typeof record.locationId === "string" ? record.locationId : "") || undefined;
    const city = typeof record.city === "string" && record.city.trim() ? record.city.trim().slice(0, 100) : undefined;
    const level = typeof record.level === "string" && (LOCATION_LEVEL_VALUES as readonly string[]).includes(record.level) ? (record.level as LocationLevel) : undefined;
    const latitude = toFiniteNumber(record.lat);
    const longitude = toFiniteNumber(record.lng);
    const validLatitude = latitude !== undefined && latitude >= -90 && latitude <= 90 ? latitude : undefined;
    const validLongitude = longitude !== undefined && longitude >= -180 && longitude <= 180 ? longitude : undefined;
    if (!locationId && (validLatitude === undefined || validLongitude === undefined)) return null;
    return {
        ...(locationId ? { locationId } : {}),
        ...(city ? { city } : {}),
        ...(level ? { level } : {}),
        ...(validLatitude !== undefined ? { lat: validLatitude } : {}),
        ...(validLongitude !== undefined ? { lng: validLongitude } : {}),
    };
}

/** Mirror the persisted location into the SSR cookie (client only). */
export function writeFeedLocationCookie(location: AppLocation | null | undefined): void {
    if (typeof document === "undefined") return;
    const serialized = serializeFeedLocationCookie(location);
    if (serialized === null) {
        clearFeedLocationCookie();
        return;
    }
    document.cookie = `${FEED_LOCATION_COOKIE_NAME}=${encodeURIComponent(serialized)}; Path=/; Max-Age=${FEED_LOCATION_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Remove the SSR location cookie (client only). */
export function clearFeedLocationCookie(): void {
    if (typeof document === "undefined") return;
    document.cookie = `${FEED_LOCATION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
