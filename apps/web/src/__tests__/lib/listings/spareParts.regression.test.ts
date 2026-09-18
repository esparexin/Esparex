/**
 * Regression tests for spare parts, contract normalization, and presentation resolvers.
 *
 * Covers root causes identified in fix/ad-detail-spare-parts-permanent:
 *   RC1: location.coordinates normalization (flat array → GeoPoint, strips [0,0])
 *   RC2: coerceListingFallback retains sparePartIds, sparePartsSnapshot, metadata
 *   RC3: resolveListingSpareParts filters raw hex ObjectIds, deduplicates
 *   RC4: resolveListingSparePartsCount consistency with resolver
 */

import { describe, it, expect } from 'vitest';
import { normalizeListing } from '@/lib/api/user/listings/normalizer';
import {
    resolveListingSpareParts,
    resolveListingSparePartsCount,
} from '@/lib/listings/listingPresentation';

// ---------------------------------------------------------------------------
// RC1 – location.coordinates normalization
// ---------------------------------------------------------------------------

describe('normalizeListing — location.coordinates (RC1)', () => {
    const baseAd = {
        id: '507f1f77bcf86cd799439011',
        title: 'Test Ad',
        price: 5000,
        description: 'Test description',
        images: [],
        status: 'active',
        sellerId: '507f1f77bcf86cd799439012',
        createdAt: new Date().toISOString(),
    };

    it('RC1a: normalizes flat [lng, lat] array to a GeoPoint object', () => {
        const raw = {
            ...baseAd,
            location: { city: 'Mumbai', state: 'Maharashtra', coordinates: [72.877655, 19.076090] },
        };
        const result = normalizeListing(raw);
        const coords = (result.location as Record<string, unknown>)?.coordinates;
        if (coords !== undefined) {
            expect((coords as { type: string }).type).toBe('Point');
            expect(Array.isArray((coords as { coordinates: unknown }).coordinates)).toBe(true);
        }
        expect(result.location.city).toBe('Mumbai');
    });

    it('RC1b: strips [0, 0] coordinates entirely', () => {
        const raw = {
            ...baseAd,
            location: { city: 'Unknown', coordinates: [0, 0] },
        };
        const result = normalizeListing(raw);
        const coords = (result.location as Record<string, unknown>)?.coordinates;
        expect(coords).toBeUndefined();
    });

    it('RC1c: passes through an already-formed GeoPoint object unchanged', () => {
        const raw = {
            ...baseAd,
            location: {
                city: 'Delhi',
                coordinates: { type: 'Point', coordinates: [77.1025, 28.7041] },
            },
        };
        const result = normalizeListing(raw);
        const coords = (result.location as Record<string, unknown>)?.coordinates;
        if (coords !== undefined) {
            expect((coords as { type: string }).type).toBe('Point');
        }
    });
});

// ---------------------------------------------------------------------------
// RC2 – coerceListingFallback retains spare parts + metadata
// ---------------------------------------------------------------------------

describe('normalizeListing — fallback retains spare parts data (RC2)', () => {
    // Missing valid ISO createdAt forces coerceListingFallback
    const partialAd = {
        id: '507f1f77bcf86cd799439011',
        title: 'Phone with Parts',
        price: 3000,
        description: 'Description',
        images: [],
        status: 'active',
        sellerId: '507f1f77bcf86cd799439012',
        location: { city: 'Delhi' },
        sparePartIds: ['507f191e810c19729de860ab', '507f191e810c19729de860ac'],
        spareParts: [
            { _id: '507f191e810c19729de860ab', id: '507f191e810c19729de860ab', name: 'LCD Screen', brand: 'Samsung' },
        ],
        sparePartsSnapshot: [
            { _id: '507f191e810c19729de860ab', id: '507f191e810c19729de860ab', name: 'LCD Screen', brand: 'Samsung' },
        ],
        categoryName: 'Mobile Phones',
        brandName: 'Samsung',
        modelName: 'Galaxy A52',
    };

    it('RC2a: sparePartIds is preserved', () => {
        const result = normalizeListing(partialAd) as Record<string, unknown>;
        expect(Array.isArray(result.sparePartIds)).toBe(true);
        expect((result.sparePartIds as string[]).length).toBeGreaterThan(0);
    });

    it('RC2b: sparePartsSnapshot is preserved with name and brand', () => {
        const result = normalizeListing(partialAd) as Record<string, unknown>;
        expect(Array.isArray(result.sparePartsSnapshot)).toBe(true);
        const snapshot = result.sparePartsSnapshot as Array<{ name: string; brand?: string }>;
        expect(snapshot[0]?.name).toBe('LCD Screen');
        expect(snapshot[0]?.brand).toBe('Samsung');
    });

    it('RC2c: categoryName / brandName / modelName preserved through fallback', () => {
        const result = normalizeListing(partialAd) as Record<string, unknown>;
        expect(result.categoryName).toBe('Mobile Phones');
        expect(result.brandName).toBe('Samsung');
        expect(result.modelName).toBe('Galaxy A52');
    });
});

// ---------------------------------------------------------------------------
// RC3 – resolveListingSpareParts raw hex ID filtering
// ---------------------------------------------------------------------------

describe('resolveListingSpareParts — hex ID filtering and deduplication (RC3)', () => {
    it('RC3a: filters out raw 24-char hex ObjectId strings from spareParts', () => {
        const ad = {
            spareParts: [
                '507f191e810c19729de860ab', // raw hex ID — must be filtered
                'LCD Screen',               // readable name — kept
                { id: '507f191e810c19729de860ac', name: 'Battery' },
            ],
        };
        const result = resolveListingSpareParts(ad);
        const names = result.map(p => p.name);
        expect(names).not.toContain('507f191e810c19729de860ab');
        expect(names).toContain('LCD Screen');
        expect(names).toContain('Battery');
    });

    it('RC3b: deduplicates entries appearing in both sparePartsSnapshot and spareParts', () => {
        const ad = {
            sparePartsSnapshot: [
                { _id: '507f191e810c19729de860ab', name: 'LCD Screen', brand: 'Samsung' },
            ],
            spareParts: [
                { id: '507f191e810c19729de860ab', name: 'LCD Screen' },
                'LCD Screen',
            ],
        };
        const result = resolveListingSpareParts(ad);
        const lcdEntries = result.filter(p => p.name === 'LCD Screen');
        expect(lcdEntries.length).toBe(1);
        expect(lcdEntries[0]?.brand).toBe('Samsung');
    });

    it('RC3c: returns empty array for null / undefined / empty ad', () => {
        expect(resolveListingSpareParts(null)).toEqual([]);
        expect(resolveListingSpareParts(undefined)).toEqual([]);
        expect(resolveListingSpareParts({})).toEqual([]);
    });

    it('RC3d: sparePartIds without readable names produce no display items', () => {
        const ad = { sparePartIds: ['507f191e810c19729de860ab', '507f191e810c19729de860ac'] };
        expect(resolveListingSpareParts(ad).length).toBe(0);
    });

    it('RC3e: snapshot brand is preserved in resolved output', () => {
        const ad = {
            sparePartsSnapshot: [
                { _id: '507f191e810c19729de860ab', name: 'Display Module', brand: 'Apple' },
            ],
        };
        const result = resolveListingSpareParts(ad);
        expect(result[0]?.brand).toBe('Apple');
    });
});

// ---------------------------------------------------------------------------
// RC4 – resolveListingSparePartsCount tab-count parity
// ---------------------------------------------------------------------------

describe('resolveListingSparePartsCount — tab count parity (RC4)', () => {
    it('RC4a: count matches resolver length, excludes raw hex IDs', () => {
        const ad = {
            spareParts: [
                '507f191e810c19729de860ab', // hex — filtered
                'LCD Screen',
                { id: 'x', name: 'Battery' },
            ],
        };
        expect(resolveListingSparePartsCount(ad)).toBe(resolveListingSpareParts(ad).length);
        expect(resolveListingSparePartsCount(ad)).toBe(2); // not 3
    });

    it('RC4b: snapshot-only ad returns correct count', () => {
        const ad = {
            sparePartsSnapshot: [
                { _id: 'a1b2c3d4e5f6a7b8c9d0e1f2', name: 'Motherboard', brand: 'Qualcomm' },
                { _id: 'a1b2c3d4e5f6a7b8c9d0e1f3', name: 'Camera Module' },
            ],
        };
        expect(resolveListingSparePartsCount(ad)).toBe(2);
    });
});
