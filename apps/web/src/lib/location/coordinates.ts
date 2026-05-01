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

// calculateDistance (Haversine) removed — use @turf/distance if needed
