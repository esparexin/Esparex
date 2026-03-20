import type { AppLocation, GeoJSONPoint } from "@/types/location";

type CoordinateRecord = {
    type?: unknown;
    coordinates?: unknown;
};

const isRecord = (value: unknown): value is CoordinateRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
};

export const isGeoJSONPoint = (value: unknown): value is GeoJSONPoint => {
    if (!isRecord(value)) return false;
    if (value.type !== "Point") return false;
    if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) return false;
    const lng = toFiniteNumber(value.coordinates[0]);
    const lat = toFiniteNumber(value.coordinates[1]);
    if (lng == null || lat == null) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    return true;
};

export function createPoint(
    lng: number,
    lat: number
): GeoJSONPoint | undefined {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
    return { type: "Point", coordinates: [lng, lat] };
}

export function getLatitude(input: unknown): number | undefined {
    if (!input) return undefined;

    if (isGeoJSONPoint(input)) {
        return input.coordinates[1];
    }

    if (isRecord(input) && isGeoJSONPoint(input.coordinates)) {
        return input.coordinates.coordinates[1];
    }

    return undefined;
}

export function getLongitude(input: unknown): number | undefined {
    if (!input) return undefined;

    if (isGeoJSONPoint(input)) {
        return input.coordinates[0];
    }

    if (isRecord(input) && isGeoJSONPoint(input.coordinates)) {
        return input.coordinates.coordinates[0];
    }

    return undefined;
}

export function toCanonicalGeoPoint(input: unknown): GeoJSONPoint | undefined {
    if (isGeoJSONPoint(input)) {
        return {
            type: "Point",
            coordinates: [input.coordinates[0], input.coordinates[1]],
        };
    }

    if (isRecord(input) && isGeoJSONPoint(input.coordinates)) {
        return {
            type: "Point",
            coordinates: [input.coordinates.coordinates[0], input.coordinates.coordinates[1]],
        };
    }

    return undefined;
}

export function normalizeCoordinates(input: unknown): GeoJSONPoint | undefined {
    return toCanonicalGeoPoint(input);
}

export function hasCoordinates(location: AppLocation): boolean {
    return getLatitude(location) != null && getLongitude(location) != null;
}

export function calculateDistance(
    from: Pick<AppLocation, "coordinates">,
    to: Pick<AppLocation, "coordinates">
): number {
    const fromLat = getLatitude(from);
    const fromLng = getLongitude(from);
    const toLat = getLatitude(to);
    const toLng = getLongitude(to);

    if (
        fromLat == null ||
        fromLng == null ||
        toLat == null ||
        toLng == null
    ) {
        return NaN;
    }

    const earthRadiusKm = 6371;
    const lat1 = (fromLat * Math.PI) / 180;
    const lon1 = (fromLng * Math.PI) / 180;
    const lat2 = (toLat * Math.PI) / 180;
    const lon2 = (toLng * Math.PI) / 180;
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
