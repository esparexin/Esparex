import type {
    CanonicalGeoPoint as SharedCanonicalGeoPoint,
    Location as SharedLocation,
    LocationLevel as SharedLocationLevel
} from "@shared/types/Location";

/**
 * PR-3: Location Contract Normalization
 *
 * AppLocation.coordinates is now a SINGLE canonical shape:
 *   GeoJSON Point: { type: "Point", coordinates: [lng, lat] }
 *
 * The previous 3-member union ([lng,lat] | {lat,lng} | GeoJSON) is collapsed.
 * Legacy data from localStorage/API is normalized at ingestion via
 * normalizeToAppLocation() in locationService.ts before being stored here.
 *
 * Consumers must use getLatitude() / getLongitude() from:
 *   @/lib/location/utils
 *
 * and must NOT perform shape detection on coordinates directly.
 */

export type AppLocationSource = "auto" | "ip" | "manual" | "default";
export type CanonicalLocation = SharedLocation;
export type LocationLevel = SharedLocationLevel;

/** Canonical GeoJSON Point — the only coordinate shape allowed in AppLocation. */
export type GeoJSONPoint = SharedCanonicalGeoPoint;

export interface AppLocation extends Partial<Pick<SharedLocation, "locationId" | "city" | "state" | "country" | "level" | "name" | "display" | "id">> {
    formattedAddress: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
    source: AppLocationSource;
    locationId?: string;
    level?: LocationLevel;
    // Backward-compatible aliases used by existing screens.
    id?: string;
    name?: string;
    display?: string;
    /** Always a GeoJSON Point. Use getLatitude()/getLongitude() from @/lib/location/utils. */
    coordinates?: GeoJSONPoint;
    detectedAt?: number;
    isAuto?: boolean;
}

export const DEFAULT_APP_LOCATION: AppLocation = {
    formattedAddress: "India",
    city: "India",
    state: "India",
    country: "India",
    source: "default",
    name: "India",
    display: "India",
    coordinates: {
        type: "Point",
        coordinates: [78.96, 20.59], // [lng, lat] — approximate center of India
    },
    detectedAt: Date.now(),
    isAuto: false,
};
