export interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number];
}
export declare const MIN_RADIUS_KM = 1;
export declare const MAX_RADIUS_KM = 500;
export declare const DEFAULT_RADIUS_KM = 50;
/**
 * Calculates the Haversine distance between two points in kilometers.
 */
export declare const haversineDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
export declare const isValidLongitude: (value: unknown) => value is number;
export declare const isValidLatitude: (value: unknown) => value is number;
export declare const isNonZeroLngLat: (lng: number, lat: number) => boolean;
export declare const isValidLngLat: (lng: unknown, lat: unknown) => lng is number;
export declare const hasValidCoordinateArray: (coords: unknown) => coords is [number, number];
export declare const isValidGeoPoint: (input: unknown) => input is GeoJSONPoint;
/**
 * Safe GeoJSON Point guard — validates coordinates without throwing.
 * Returns the original object unchanged when valid; undefined when invalid.
 * Used in Mongoose pre-save/findOneAndUpdate hooks as a no-op passthrough guard.
 */
export declare const sanitizeGeoPoint: (value: unknown) => unknown;
/**
 * Extracts and strictly formats a GeoJSON Point [lng, lat].
 * THROWS explicit errors on bad data to prevent silent logic bypasses.
 */
export declare const toGeoPoint: (input: unknown) => GeoJSONPoint;
//# sourceMappingURL=geoUtils.d.ts.map