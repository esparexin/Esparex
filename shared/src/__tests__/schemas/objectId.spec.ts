import { describe, it, expect } from 'vitest';
import { objectIdSchema } from '../../schemas/common.schemas';

describe('objectIdSchema', () => {
    it('accepts valid 24-char hex string', () => {
        const result = objectIdSchema.safeParse('507f1f77bcf86cd799439011');
        expect(result.success).toBe(true);
    });

    it('rejects invalid ObjectId', () => {
        const result = objectIdSchema.safeParse('invalid');
        expect(result.success).toBe(false);
    });

    it('rejects non-string', () => {
        const result = objectIdSchema.safeParse(123);
        expect(result.success).toBe(false);
    });
});
