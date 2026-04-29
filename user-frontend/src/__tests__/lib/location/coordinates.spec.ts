import { describe, it, expect } from 'vitest';
import {
    isGeoJSONPoint,
    createPoint,
    toCanonicalGeoPoint,
} from '@/lib/location/coordinates';

describe('isGeoJSONPoint', () => {
    it('returns true for valid GeoJSON Point', () => {
        expect(isGeoJSONPoint({ type: 'Point', coordinates: [78.96, 20.59] })).toBe(true);
    });

    it('returns false for null', () => {
        expect(isGeoJSONPoint(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isGeoJSONPoint(undefined)).toBe(false);
    });

    it('returns false for wrong type string', () => {
        expect(isGeoJSONPoint({ type: 'MultiPoint', coordinates: [78.96, 20.59] })).toBe(false);
    });

    it('returns false for wrong coordinates array length', () => {
        expect(isGeoJSONPoint({ type: 'Point', coordinates: [78.96] })).toBe(false);
    });

    it('returns false for coordinates with out-of-range latitude > 90', () => {
        expect(isGeoJSONPoint({ type: 'Point', coordinates: [78.96, 91] })).toBe(false);
    });

    it('returns false for coordinates with out-of-range latitude < -90', () => {
        expect(isGeoJSONPoint({ type: 'Point', coordinates: [78.96, -91] })).toBe(false);
    });

    it('returns false for coordinates with out-of-range longitude > 180', () => {
        expect(isGeoJSONPoint({ type: 'Point', coordinates: [181, 20.59] })).toBe(false);
    });

    it('returns false for coordinates with out-of-range longitude < -180', () => {
        expect(isGeoJSONPoint({ type: 'Point', coordinates: [-181, 20.59] })).toBe(false);
    });

    it('returns true for [0, 0] — null-island passes format validation (caller rejects)', () => {
        // isGeoJSONPoint only checks shape, not null-island; caller logic rejects [0,0]
        expect(isGeoJSONPoint({ type: 'Point', coordinates: [0, 0] })).toBe(true);
    });
});

describe('createPoint', () => {
    it('creates a valid GeoJSON Point for normal coords', () => {
        const point = createPoint(78.96, 20.59);
        expect(point).toEqual({ type: 'Point', coordinates: [78.96, 20.59] });
    });

    it('returns undefined for non-finite longitude', () => {
        expect(createPoint(NaN, 20.59)).toBeUndefined();
    });

    it('returns undefined for non-finite latitude', () => {
        expect(createPoint(78.96, NaN)).toBeUndefined();
    });

    it('returns undefined for lat > 90', () => {
        expect(createPoint(78.96, 91)).toBeUndefined();
    });

    it('returns undefined for lat < -90', () => {
        expect(createPoint(78.96, -91)).toBeUndefined();
    });

    it('returns undefined for lng > 180', () => {
        expect(createPoint(181, 20.59)).toBeUndefined();
    });

    it('returns undefined for lng < -180', () => {
        expect(createPoint(-181, 20.59)).toBeUndefined();
    });

    it('preserves [lng, lat] order in coordinates array', () => {
        const point = createPoint(78.96, 20.59);
        expect(point?.coordinates[0]).toBe(78.96); // longitude
        expect(point?.coordinates[1]).toBe(20.59); // latitude
    });
});

describe('toCanonicalGeoPoint', () => {
    it('returns a GeoJSON Point from a valid object input', () => {
        const result = toCanonicalGeoPoint({ type: 'Point', coordinates: [78.96, 20.59] });
        expect(result).toEqual({ type: 'Point', coordinates: [78.96, 20.59] });
    });

    it('returns undefined for null input', () => {
        expect(toCanonicalGeoPoint(null)).toBeUndefined();
    });

    it('returns undefined for undefined input', () => {
        expect(toCanonicalGeoPoint(undefined)).toBeUndefined();
    });

    it('handles nested coordinates (object with .coordinates = GeoJSONPoint)', () => {
        const nested = { coordinates: { type: 'Point', coordinates: [78.96, 20.59] } };
        const result = toCanonicalGeoPoint(nested);
        expect(result).toEqual({ type: 'Point', coordinates: [78.96, 20.59] });
    });

    it('returns a new object (not the same reference)', () => {
        const input = { type: 'Point', coordinates: [78.96, 20.59] as [number, number] };
        const result = toCanonicalGeoPoint(input);
        expect(result).not.toBe(input);
    });
});
