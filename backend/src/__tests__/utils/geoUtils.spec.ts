
import {
    toGeoPoint,
    isValidGeoPoint,
    hasValidCoordinateArray,
} from '../../../../shared/utils/geoUtils';

describe('toGeoPoint', () => {
    it('returns a GeoJSON Point for valid [lng, lat] tuple input', () => {
        const result = toGeoPoint([78.96, 20.59]);
        expect(result).toEqual({ type: 'Point', coordinates: [78.96, 20.59] });
    });

    it('returns a GeoJSON Point from a { lat, lng } object', () => {
        const result = toGeoPoint({ lat: 20.59, lng: 78.96 });
        expect(result).toEqual({ type: 'Point', coordinates: [78.96, 20.59] });
    });

    it('returns a GeoJSON Point from a GeoJSON Point object', () => {
        const input = { type: 'Point', coordinates: [78.96, 20.59] };
        const result = toGeoPoint(input);
        expect(result).toEqual({ type: 'Point', coordinates: [78.96, 20.59] });
    });

    it('throws on null input', () => {
        expect(() => toGeoPoint(null)).toThrow();
    });

    it('throws on undefined input', () => {
        expect(() => toGeoPoint(undefined)).toThrow();
    });

    it('throws for [0, 0] (null-island is rejected)', () => {
        expect(() => toGeoPoint([0, 0])).toThrow();
    });

    it('preserves [lng, lat] order — longitude is index 0, latitude is index 1', () => {
        const result = toGeoPoint([77.2090, 28.6139]);
        expect(result.coordinates[0]).toBe(77.2090); // longitude
        expect(result.coordinates[1]).toBe(28.6139); // latitude
    });

    it('throws for out-of-range latitude (> 90)', () => {
        expect(() => toGeoPoint([78.96, 91])).toThrow();
    });

    it('throws for out-of-range longitude (> 180)', () => {
        expect(() => toGeoPoint([181, 20.59])).toThrow();
    });
});

describe('isValidGeoPoint', () => {
    it('returns true for valid GeoJSON Point', () => {
        expect(isValidGeoPoint({ type: 'Point', coordinates: [78.96, 20.59] })).toBe(true);
    });

    it('returns false for null', () => {
        expect(isValidGeoPoint(null)).toBe(false);
    });

    it('returns false for [0, 0] (null-island)', () => {
        expect(isValidGeoPoint({ type: 'Point', coordinates: [0, 0] })).toBe(false);
    });

    it('returns false for wrong type', () => {
        expect(isValidGeoPoint({ type: 'Line', coordinates: [78.96, 20.59] })).toBe(false);
    });
});

describe('hasValidCoordinateArray', () => {
    it('returns true for valid [lng, lat]', () => {
        expect(hasValidCoordinateArray([78.96, 20.59])).toBe(true);
    });

    it('returns false for [0, 0]', () => {
        expect(hasValidCoordinateArray([0, 0])).toBe(false);
    });

    it('returns false for single-element array', () => {
        expect(hasValidCoordinateArray([78.96])).toBe(false);
    });

    it('returns false for null', () => {
        expect(hasValidCoordinateArray(null)).toBe(false);
    });
});
