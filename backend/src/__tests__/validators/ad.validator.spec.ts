import {
    getAdsQuerySchema,
    markAsSoldSchema,
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
