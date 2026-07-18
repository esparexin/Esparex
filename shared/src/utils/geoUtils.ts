// GeoJSONPoint is the canonical type from @esparex/contracts
// Re-exported here so geoUtils consumers get it via a single import
export type { GeoJSONPoint } from '@esparex/contracts';
import type { GeoJSONPoint } from '@esparex/contracts';


export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 500;
export const DEFAULT_RADIUS_KM = 50;

/**
 * Calculates the Haversine distance between two points in kilometers.
 */
export const haversineDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const isValidLongitude = (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180;

export const isValidLatitude = (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90;

export const isNonZeroLngLat = (lng: number, lat: number): boolean =>
    !(lng === 0 && lat === 0);

export const isValidLngLat = (lng: unknown, lat: unknown): lng is number =>
    isValidLongitude(lng) &&
    isValidLatitude(lat) &&
    isNonZeroLngLat(lng, lat);

export const hasValidCoordinateArray = (coords: unknown): coords is [number, number] =>
    Array.isArray(coords) &&
    coords.length === 2 &&
    isValidLngLat(coords[0], coords[1]);

export const isValidGeoPoint = (input: unknown): input is GeoJSONPoint => {
    if (!input || typeof input !== 'object') return false;
    const obj = input as Record<string, unknown>;
    return obj.type === 'Point' && hasValidCoordinateArray(obj.coordinates);
};

/**
 * Safe Canonical GeoJSON Point normalizer.
 * Enforces valid [longitude, latitude] array order, finite bounds, and rejects Null Island [0,0].
 * THROWS explicit errors on bad data to prevent silent logic bypasses.
 */
export const normalizeGeoPoint = (input: unknown): GeoJSONPoint => {
    if (!input || typeof input !== 'object') {
        throw new Error("ERR_GEO_01: Input coordinates cannot be null or undefined.");
    }

    if (hasValidCoordinateArray(input)) {
        return {
            type: 'Point',
            coordinates: [Number(input[0]), Number(input[1])]
        };
    }

    if (isValidGeoPoint(input)) {
        const point = input as GeoJSONPoint;
        return {
            type: 'Point',
            coordinates: [Number(point.coordinates[0]), Number(point.coordinates[1])]
        };
    }

    const rawInput = input as Record<string, unknown>;

    if (rawInput && typeof rawInput === 'object') {
        if ('lat' in rawInput && 'lng' in rawInput) {
            const lat = Number(rawInput.lat);
            const lng = Number(rawInput.lng);
            if (isValidLngLat(lng, lat)) {
                return {
                    type: 'Point',
                    coordinates: [lng, lat]
                };
            }
        }

        // Handle nested coordinates property (for Mongoose/Canonical shapes)
        if (rawInput.coordinates && isValidGeoPoint(rawInput.coordinates)) {
            const coords = (rawInput.coordinates as GeoJSONPoint).coordinates;
            return {
                type: 'Point',
                coordinates: [Number(coords[0]), Number(coords[1])]
            };
        }
    }

    throw new Error(`ERR_GEO_02: Unrecognized location format: ${JSON.stringify(input)}`);
};

export function getLatitude(input: unknown): number | undefined {
    try {
        const pt = normalizeGeoPoint(input);
        return pt.coordinates[1];
    } catch {
        return undefined;
    }
}

export function getLongitude(input: unknown): number | undefined {
    try {
        const pt = normalizeGeoPoint(input);
        return pt.coordinates[0];
    } catch {
        return undefined;
    }
}

export function hasCoordinates(input: unknown): boolean {
    try {
        normalizeGeoPoint(input);
        return true;
    } catch {
        return false;
    }
}

export function createPoint(lng: number, lat: number): GeoJSONPoint | undefined {
    try {
        return normalizeGeoPoint([lng, lat]);
    } catch {
        return undefined;
    }
}
export function toCanonicalGeoPoint(input: unknown): GeoJSONPoint | undefined {
    try {
        return normalizeGeoPoint(input);
    } catch {
        return undefined;
    }
}
