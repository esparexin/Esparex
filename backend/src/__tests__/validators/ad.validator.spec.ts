import {
    getAdsQuerySchema,
    homeFeedQuerySchema,
    markAsSoldSchema,
    trendingAdsQuerySchema,
} from '../../validators/ad.validator';

const validObjectId = '507f1f77bcf86cd799439011';

describe('getAdsQuerySchema', () => {
    it('accepts canonical sellerId query filter', () => {
        const parsed = getAdsQuerySchema.parse({
            page: '1',
            limit: '20',
            sellerId: validObjectId,
        });

        expect(parsed.sellerId).toBe(validObjectId);
    });

    it('rejects deprecated userId alias query filter', () => {
        expect(() =>
            getAdsQuerySchema.parse({
                page: '1',
                limit: '20',
                userId: validObjectId,
            })
        ).toThrow(/userId/i);
    });

    it('rejects deprecated text aliases for search/category/location filters', () => {
        expect(() =>
            getAdsQuerySchema.parse({
                page: '1',
                limit: '20',
                search: 'iphone',
                category: 'phones',
                location: 'Pune',
            })
        ).toThrow(/search|category|location/i);
    });
});

describe('homeFeedQuerySchema', () => {
    it('accepts canonical locationId/categoryId feed filters', () => {
        const parsed = homeFeedQuerySchema.parse({
            limit: '12',
            locationId: validObjectId,
            categoryId: validObjectId,
        });

        expect(parsed.limit).toBe(12);
        expect(parsed.locationId).toBe(validObjectId);
        expect(parsed.categoryId).toBe(validObjectId);
    });

    it('rejects deprecated feed location/category aliases', () => {
        expect(() =>
            homeFeedQuerySchema.parse({
                limit: '12',
                location: 'Pune',
                category: 'phones',
            })
        ).toThrow(/location|category/i);
    });
});

describe('trendingAdsQuerySchema', () => {
    it('rejects deprecated trending aliases', () => {
        expect(() =>
            trendingAdsQuerySchema.parse({
                limit: '10',
                location: 'Pune',
            })
        ).toThrow(/location/i);
    });
});

describe('markAsSoldSchema', () => {
    it('accepts soldReason payload from profile sold flow', () => {
        const parsed = markAsSoldSchema.parse({
            soldReason: 'sold_outside',
        });

        expect(parsed).toEqual({
            soldReason: 'sold_outside',
        });
    });

    it('rejects unsupported soldReason values', () => {
        expect(() =>
            markAsSoldSchema.parse({
                soldReason: 'invalid_reason',
            })
        ).toThrow();
    });
});
