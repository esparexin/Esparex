import { markAsSoldSchema } from '../../validators/ad.validator';

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

