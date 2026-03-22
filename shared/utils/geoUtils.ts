import { z } from 'zod';

export interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

const coordsTupleSchema = z.tuple([z.number(), z.number()]);
const latLngObjSchema = z.object({ lat: z.number(), lng: z.number() });

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
    try {
        if (!input || typeof input !== 'object') return false;
        const obj = input as any;
        return obj.type === 'Point'
            && hasValidCoordinateArray(obj.coordinates);
    } catch {
        return false;
    }
};

/**
 * Safe GeoJSON Point guard — validates coordinates without throwing.
 * Returns the original object unchanged when valid; undefined when invalid.
 * Used in Mongoose pre-save/findOneAndUpdate hooks as a no-op passthrough guard.
 */
export const sanitizeGeoPoint = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') return undefined;
    const node = value as Record<string, unknown>;
    const coords = Array.isArray(node.coordinates) ? node.coordinates as number[] : undefined;
    return coords && hasValidCoordinateArray(coords) ? node : undefined;
};

/**
 * Extracts and strictly formats a GeoJSON Point [lng, lat].
 * THROWS explicit errors on bad data to prevent silent logic bypasses.
 */
export const toGeoPoint = (input: unknown): GeoJSONPoint => {
    if (!input) {
        throw new Error("ERR_GEO_01: Input coordinates cannot be null or undefined.");
    }

    if (isValidGeoPoint(input)) {
        return {
            type: 'Point',
            coordinates: [Number((input as any).coordinates[0]), Number((input as any).coordinates[1])]
        };
    }

    const rawInput = input as any;

    if (rawInput.coordinates && isValidGeoPoint(rawInput.coordinates)) {
        return {
            type: 'Point',
            coordinates: [Number(rawInput.coordinates.coordinates[0]), Number(rawInput.coordinates.coordinates[1])]
        };
    }

    const latLngParse = latLngObjSchema.safeParse(input);
    if (latLngParse.success) {
        if (!isValidLngLat(latLngParse.data.lng, latLngParse.data.lat)) {
            throw new Error("ERR_GEO_03: Coordinates must be within valid longitude/latitude bounds and cannot be [0,0].");
        }
        return {
            type: 'Point',
            coordinates: [latLngParse.data.lng, latLngParse.data.lat]
        };
    }

    const tupleParse = coordsTupleSchema.safeParse(input);
    if (tupleParse.success) {
        if (!isValidLngLat(tupleParse.data[0], tupleParse.data[1])) {
            throw new Error("ERR_GEO_03: Coordinates must be within valid longitude/latitude bounds and cannot be [0,0].");
        }
        return {
            type: 'Point',
            coordinates: [tupleParse.data[0], tupleParse.data[1]]
        };
    }

    throw new Error(`ERR_GEO_02: Unrecognized location format: ${JSON.stringify(input)}`);
};
