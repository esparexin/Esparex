import { PipelineStage } from 'mongoose';
import { 
    isValidLngLat, 
    toGeoPoint,
    type GeoJSONPoint
} from '../../../shared/utils/geoUtils';

/**
 * 🌍 CANONICAL GEO UTILITY LAYER
 * SSOT for all coordinate normalization, distance logic, and MongoDB geo-query building.
 */

export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 500;
export const DEFAULT_RADIUS_KM = 50;

/**
 * Normalizes input coordinates into a standard object with a boolean flag.
 * Leverages shared validators but ensures a safe return for query builders.
 */
export const normalizeGeoInput = (lat?: number | string | null, lng?: number | string | null): { 
    lat: number; 
    lng: number; 
    hasGeo: boolean;
} => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const hasGeo = isValidLngLat(lngNum, latNum);
        
    return {
        lat: hasGeo ? latNum : 0,
        lng: hasGeo ? lngNum : 0,
        hasGeo
    };
};

/**
 * Coerces varied location input shapes into a canonical GeoJSON Point.
 * Handles strings, objects with lat/lng, and nested GeoJSON structures.
 */
export const normalizeToGeoJSON = (input: unknown): GeoJSONPoint | undefined => {
    if (!input) return undefined;
    try {
        return toGeoPoint(input);
    } catch {
        return undefined;
    }
};

export interface GeoNearOptions {
    lng: number;
    lat: number;
    key?: string;
    radiusKm?: number;
    distanceField?: string;
    query?: Record<string, unknown>;
}

/**
 * Builds a standardized $geoNear stage for aggregation pipelines.
 * Enforces high-performance bounds and coordinate consistency.
 */
export const buildGeoNearStage = (options: GeoNearOptions): PipelineStage.GeoNear => {
    const {
        lng: rawLng,
        lat: rawLat,
        key = 'location.coordinates',
        radiusKm,
        distanceField = 'distance',
        query = {}
    } = options;

    const { lat, lng, hasGeo } = normalizeGeoInput(rawLat, rawLng);
    if (!hasGeo) {
        throw new Error('ERR_GEO_04: Invalid coordinates for $geoNear. Must be finite and non-zero.');
    }

    // Enforce standardized radius caps
    const safeRadius = Math.min(
        Math.max(Number(radiusKm) || DEFAULT_RADIUS_KM, MIN_RADIUS_KM),
        MAX_RADIUS_KM
    );

    return {
        $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            key,
            distanceField,
            spherical: true,
            maxDistance: safeRadius * 1000, // MongoDB uses meters
            query
        }
    };
};
