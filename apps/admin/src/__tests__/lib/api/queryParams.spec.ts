import { describe, it, expect } from 'vitest';
import { buildQueryString } from '@/lib/api/queryParams';

describe('buildQueryString', () => {
    it('builds query string from key-value pairs', () => {
        const result = buildQueryString({ page: '2', status: 'pending' });
        expect(result).toContain('page=2');
        expect(result).toContain('status=pending');
    });

    it('skips null and undefined values', () => {
        const result = buildQueryString({ page: '2', status: null, extra: undefined });
        expect(result).toBe('page=2');
    });

    it('converts boolean values to "true"/"false"', () => {
        expect(buildQueryString({ active: true })).toBe('active=true');
        expect(buildQueryString({ active: false })).toBe('active=false');
    });

    it('skips empty string by default', () => {
        const result = buildQueryString({ q: '' });
        expect(result).toBe('');
    });

    it('includes empty string when skipEmptyString is false', () => {
        const result = buildQueryString({ q: '' }, { skipEmptyString: false });
        expect(result).toBe('q=');
    });

    it('returns empty string for empty filters', () => {
        expect(buildQueryString({})).toBe('');
        expect(buildQueryString()).toBe('');
    });
});
