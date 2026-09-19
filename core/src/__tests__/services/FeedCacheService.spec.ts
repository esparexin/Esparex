import { buildHomeFeedCacheKey } from '../../domains/discovery/application/services/feed/FeedCacheService';

describe('FeedCacheService - Cache Key Isolation by Listing Type', () => {
    const baseRequest = {
        location: 'Hyderabad',
        radiusKm: 50,
        categoryId: 'cat-123',
    };

    it('generates distinct cache keys for all, ad, service, and spare_part', () => {
        const keyAll = buildHomeFeedCacheKey({ ...baseRequest, listingType: 'all' }, null, 12);
        const keyAd = buildHomeFeedCacheKey({ ...baseRequest, listingType: 'ad' }, null, 12);
        const keyService = buildHomeFeedCacheKey({ ...baseRequest, listingType: 'service' }, null, 12);
        const keySparePart = buildHomeFeedCacheKey({ ...baseRequest, listingType: 'spare_part' }, null, 12);

        expect(keyAll).toContain(':all:');
        expect(keyAd).toContain(':ad:');
        expect(keyService).toContain(':service:');
        expect(keySparePart).toContain(':spare_part:');

        // All 4 cache keys must be strictly unique to prevent cross-tab cache pollution
        const uniqueKeys = new Set([keyAll, keyAd, keyService, keySparePart]);
        expect(uniqueKeys.size).toBe(4);
    });

    it('defaults undefined listingType to all in cache key', () => {
        const keyUndefined = buildHomeFeedCacheKey({ ...baseRequest, listingType: undefined }, null, 12);
        const keyAll = buildHomeFeedCacheKey({ ...baseRequest, listingType: 'all' }, null, 12);

        expect(keyUndefined).toBe(keyAll);
    });

    it('isolates cache keys across different locations for the same listingType', () => {
        const keyHydServices = buildHomeFeedCacheKey({ location: 'Hyderabad', listingType: 'service' }, null, 12);
        const keyPuneServices = buildHomeFeedCacheKey({ location: 'Pune', listingType: 'service' }, null, 12);

        expect(keyHydServices).not.toBe(keyPuneServices);
        expect(keyHydServices).toContain('hyderabad');
        expect(keyPuneServices).toContain('pune');
    });

    it('isolates cache keys across pagination cursors for the same listingType', () => {
        const cursorA = { createdAt: new Date('2026-03-21T00:00:00.000Z'), id: '654321654321654321654321', mode: 'compound' as const };
        const cursorB = { createdAt: new Date('2026-03-20T00:00:00.000Z'), id: '123456123456123456123456', mode: 'compound' as const };

        const keyPage1 = buildHomeFeedCacheKey({ ...baseRequest, listingType: 'service' }, null, 12);
        const keyCursorA = buildHomeFeedCacheKey({ ...baseRequest, listingType: 'service' }, cursorA, 12);
        const keyCursorB = buildHomeFeedCacheKey({ ...baseRequest, listingType: 'service' }, cursorB, 12);

        expect(keyPage1).not.toBe(keyCursorA);
        expect(keyCursorA).not.toBe(keyCursorB);
    });
});
