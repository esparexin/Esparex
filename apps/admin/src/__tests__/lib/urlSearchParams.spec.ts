import { describe, it, expect } from 'vitest';
import {
    normalizeSearchParamValue,
    parsePositiveIntParam,
    updateSearchParams,
    buildUrlWithSearchParams,
} from '@/lib/urlSearchParams';

describe('normalizeSearchParamValue', () => {
    it('trims strings', () => {
        expect(normalizeSearchParamValue('  hello  ')).toBe('hello');
    });

    it('returns empty string for null/undefined', () => {
        expect(normalizeSearchParamValue(null)).toBe('');
        expect(normalizeSearchParamValue(undefined)).toBe('');
    });
});

describe('parsePositiveIntParam', () => {
    it('parses valid integers', () => {
        expect(parsePositiveIntParam('5')).toBe(5);
        expect(parsePositiveIntParam('1')).toBe(1);
    });

    it('returns fallback for invalid values', () => {
        expect(parsePositiveIntParam('abc')).toBe(1);
        expect(parsePositiveIntParam('0')).toBe(1);
        expect(parsePositiveIntParam('-1')).toBe(1);
        expect(parsePositiveIntParam(null)).toBe(1);
    });

    it('uses custom fallback', () => {
        expect(parsePositiveIntParam(null, 10)).toBe(10);
    });
});

describe('updateSearchParams', () => {
    it('sets a new param', () => {
        const result = updateSearchParams(new URLSearchParams(), { page: '2' });
        expect(result.get('page')).toBe('2');
    });

    it('removes param when value is null', () => {
        const result = updateSearchParams(new URLSearchParams('page=2'), { page: null });
        expect(result.has('page')).toBe(false);
    });

    it('removes param when value is empty string', () => {
        const result = updateSearchParams(new URLSearchParams('page=2'), { page: '' });
        expect(result.has('page')).toBe(false);
    });

    it('trims values', () => {
        const result = updateSearchParams(new URLSearchParams(), { q: '  search  ' });
        expect(result.get('q')).toBe('search');
    });

    it('converts number values', () => {
        const result = updateSearchParams(new URLSearchParams(), { limit: 20 });
        expect(result.get('limit')).toBe('20');
    });
});

describe('buildUrlWithSearchParams', () => {
    it('appends params to pathname', () => {
        const params = new URLSearchParams('page=1');
        expect(buildUrlWithSearchParams('/ads', params)).toBe('/ads?page=1');
    });

    it('returns bare pathname when params are empty', () => {
        const params = new URLSearchParams();
        expect(buildUrlWithSearchParams('/dashboard', params)).toBe('/dashboard');
    });
});
