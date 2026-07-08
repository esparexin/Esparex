import { describe, it, expect } from 'vitest';
import { formatPrice, formatDate } from '../../utils/formatters';

describe('formatPrice', () => {
    it('formats whole number as INR', () => {
        const result = formatPrice(50000);
        expect(result).toContain('₹');
        expect(result).toContain('50,000');
    });

    it('formats zero', () => {
        expect(formatPrice(0)).toContain('₹');
    });

    it('formats small numbers', () => {
        expect(formatPrice(99)).toContain('₹');
    });
});

describe('formatDate', () => {
    it('formats ISO date string', () => {
        const result = formatDate('2026-07-08');
        expect(result).toContain('Jul');
        expect(result).toContain('2026');
    });

    it('formats Date object', () => {
        const result = formatDate(new Date('2026-01-15'));
        expect(result).toContain('Jan');
    });

    it('returns valid date format', () => {
        const result = formatDate('2026-12-25');
        expect(result).toMatch(/\d{1,2}\s\w{3}\s\d{4}/);
    });
});
