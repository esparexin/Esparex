import { isValidObjectId, validateObjectIdOrThrow } from '../../utils/idUtils';
import { commonSchemas } from '../../validators/common';

describe('isValidObjectId', () => {
    it('returns true for valid 24-char hex string', () => {
        expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });

    it('returns false for non-string values', () => {
        expect(isValidObjectId(123)).toBe(false);
        expect(isValidObjectId(null)).toBe(false);
        expect(isValidObjectId(undefined)).toBe(false);
    });

    it('returns false for short strings', () => {
        expect(isValidObjectId('abc123')).toBe(false);
    });

    it('returns false for invalid hex chars', () => {
        expect(isValidObjectId('zzzzzzzzzzzzzzzzzzzzzzzz')).toBe(false);
    });
});

describe('validateObjectIdOrThrow', () => {
    it('returns validated id for valid input', () => {
        expect(validateObjectIdOrThrow('test', '507f1f77bcf86cd799439011'))
            .toBe('507f1f77bcf86cd799439011');
    });

    it('throws for invalid id', () => {
        expect(() => validateObjectIdOrThrow('test', 'invalid'))
            .toThrow('Invalid format for test');
    });
});

describe('commonSchemas.objectId', () => {
    it('accepts valid ObjectId', () => {
        const result = commonSchemas.objectId.safeParse('507f1f77bcf86cd799439011');
        expect(result.success).toBe(true);
    });

    it('rejects invalid ObjectId', () => {
        expect(commonSchemas.objectId.safeParse('invalid').success).toBe(false);
    });
});

describe('commonSchemas.pagination', () => {
    it('parses valid pagination params', () => {
        const result = commonSchemas.pagination.safeParse({ page: '2', limit: '50' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.page).toBe(2);
            expect(result.data.limit).toBe(50);
        }
    });

    it('applies defaults for missing values', () => {
        const result = commonSchemas.pagination.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.page).toBe(1);
            expect(result.data.limit).toBe(20);
        }
    });

    it('rejects zero page', () => {
        expect(commonSchemas.pagination.safeParse({ page: '0' }).success).toBe(false);
    });
});
