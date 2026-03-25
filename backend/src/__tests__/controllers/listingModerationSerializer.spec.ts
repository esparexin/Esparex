/**
 * Unit tests for listingModerationSerializer helpers.
 * All helpers are pure functions — no DB or external deps needed.
 */

import {
    serializeModerationListing,
    serializeModerationListResponse,
} from '../../controllers/admin/listingModerationSerializer';

// ─── throwContractError (via serializeModerationListing) ─────────────────────

describe('throwContractError (via serializeModerationListing)', () => {
    it('throws when payload is not an object', () => {
        expect(() => serializeModerationListing(null)).toThrow('Listing serialization failure');
        expect(() => serializeModerationListing('string')).toThrow('Listing serialization failure');
        expect(() => serializeModerationListing(42)).toThrow('Listing serialization failure');
        expect(() => serializeModerationListing([])).toThrow('Listing serialization failure');
    });

    it('attaches statusCode 500 and LISTING_SERIALIZATION_FAILED code', () => {
        expect.assertions(2);
        try {
            serializeModerationListing(null);
        } catch (err: unknown) {
            expect((err as { code?: string }).code).toBe('LISTING_SERIALIZATION_FAILED');
            expect((err as { statusCode?: number }).statusCode).toBe(500);
        }
    });

    it('attaches code LISTING_CONTRACT_VIOLATION for type/status violations', () => {
        expect.assertions(2);
        try {
            serializeModerationListing({ _id: '1', status: 'live', listingType: 'nope' });
        } catch (err: unknown) {
            expect((err as { code?: string }).code).toBe('LISTING_CONTRACT_VIOLATION');
            expect((err as { statusCode?: number }).statusCode).toBe(500);
        }
    });
});

// ─── serializeModerationListing ──────────────────────────────────────────────

describe('serializeModerationListing', () => {
    it('throws on invalid listingType instead of coercing to ad', () => {
        expect(() =>
            serializeModerationListing({ _id: 'abc123', status: 'live', listingType: 'unknown' })
        ).toThrow('missing/invalid listingType');
    });

    it('throws on invalid status', () => {
        expect(() =>
            serializeModerationListing({ _id: '1', status: 'published', listingType: 'ad' })
        ).toThrow('missing/invalid status');
    });

    it('preserves valid listingType values', () => {
        const listing = serializeModerationListing({ _id: 'abc123', status: 'live', listingType: 'service' });
        expect(listing.listingType).toBe('service');
        expect(listing.id).toBe('abc123');
    });

    it('accepts all valid listing types', () => {
        for (const type of ['ad', 'service', 'spare_part']) {
            expect(() =>
                serializeModerationListing({ _id: '1', status: 'live', listingType: type })
            ).not.toThrow();
        }
    });

    it('accepts all valid moderation statuses', () => {
        for (const status of ['pending', 'live', 'rejected', 'expired', 'sold', 'deactivated']) {
            expect(() =>
                serializeModerationListing({ _id: '1', status, listingType: 'ad' })
            ).not.toThrow();
        }
    });

    it('trims and lowercases status and listingType', () => {
        const result = serializeModerationListing({ _id: '1', status: '  LIVE  ', listingType: '  AD  ' });
        expect(result.status).toBe('live');
        expect(result.listingType).toBe('ad');
    });

    it('prefers id over _id when both present', () => {
        const result = serializeModerationListing({
            id: 'explicit-id', _id: 'fallback-id', status: 'pending', listingType: 'service',
        });
        expect(result.id).toBe('explicit-id');
    });

    it('falls back to _id when id is absent', () => {
        const result = serializeModerationListing({ _id: 'fallback-id', status: 'rejected', listingType: 'spare_part' });
        expect(result.id).toBe('fallback-id');
    });

    it('preserves additional fields from the raw record', () => {
        const result = serializeModerationListing({ _id: '1', status: 'live', listingType: 'ad', title: 'Test Ad' });
        expect((result as Record<string, unknown>).title).toBe('Test Ad');
    });
});

// ─── serializeModerationListResponse ────────────────────────────────────────

describe('serializeModerationListResponse', () => {
    it('returns correctly shaped pagination envelope', () => {
        const result = serializeModerationListResponse({
            items: [{ _id: '1', status: 'live', listingType: 'ad' }],
            page: 1, limit: 20, total: 1, totalPages: 1,
        });
        expect(result).toMatchObject({
            items: expect.any(Array),
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        });
    });

    it('serializes each item through serializeModerationListing', () => {
        const result = serializeModerationListResponse({
            items: [{ _id: 'xyz', status: 'pending', listingType: 'service' }],
            page: 1, limit: 10, total: 1, totalPages: 1,
        });
        expect(result.items[0].id).toBe('xyz');
    });

    it('passes totalPages through to the pagination envelope', () => {
        const result = serializeModerationListResponse({ items: [], page: 2, limit: 10, total: 25, totalPages: 3 });
        expect(result.pagination.totalPages).toBe(3);
    });

    it('passes zero totalPages when explicitly provided', () => {
        const result = serializeModerationListResponse({ items: [], page: 1, limit: 10, total: 0, totalPages: 0 });
        expect(result.pagination.totalPages).toBe(0);
    });
});
