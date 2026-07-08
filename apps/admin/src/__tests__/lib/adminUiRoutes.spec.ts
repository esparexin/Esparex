import { describe, it, expect } from 'vitest';
import {
    ADMIN_UI_ROUTES,
    mergeAdminSearchParams,
    readStringParam,
    readPositiveIntParam,
} from '@/lib/adminUiRoutes';

describe('ADMIN_UI_ROUTES', () => {
    it('login builds path with optional next', () => {
        expect(ADMIN_UI_ROUTES.login()).toBe('/login');
        expect(ADMIN_UI_ROUTES.login('/dashboard')).toBe('/login?next=%2Fdashboard');
    });

    it('dashboard returns root path', () => {
        expect(ADMIN_UI_ROUTES.dashboard()).toBe('/dashboard');
    });

    it('ads builds path with query', () => {
        expect(ADMIN_UI_ROUTES.ads({ status: 'pending' })).toBe('/ads?status=pending');
    });

    it('ads returns bare path without query', () => {
        expect(ADMIN_UI_ROUTES.ads()).toBe('/ads');
    });

    it('userById builds encoded path', () => {
        expect(ADMIN_UI_ROUTES.userById('abc123')).toBe('/users/abc123');
    });

    it('spareParts builds path', () => {
        expect(ADMIN_UI_ROUTES.spareParts()).toBe('/spare-parts');
    });
});

describe('mergeAdminSearchParams', () => {
    it('merges updates into current params', () => {
        const current = new URLSearchParams('status=pending');
        const result = mergeAdminSearchParams(current, { page: '2' });
        expect(result.get('status')).toBe('pending');
        expect(result.get('page')).toBe('2');
    });

    it('removes params when value is null', () => {
        const current = new URLSearchParams('status=pending');
        const result = mergeAdminSearchParams(current, { status: null });
        expect(result.has('status')).toBe(false);
    });

    it('removes params when value is empty string after trim', () => {
        const current = new URLSearchParams('q=test');
        const result = mergeAdminSearchParams(current, { q: '   ' });
        expect(result.has('q')).toBe(false);
    });
});

describe('readStringParam', () => {
    it('returns trimmed value', () => {
        expect(readStringParam('  hello  ')).toBe('hello');
    });

    it('returns fallback for null/undefined', () => {
        expect(readStringParam(null)).toBe('');
        expect(readStringParam(undefined)).toBe('');
    });

    it('returns fallback for empty string', () => {
        expect(readStringParam('')).toBe('');
        expect(readStringParam('   ')).toBe('');
    });

    it('uses custom fallback', () => {
        expect(readStringParam(null, 'default')).toBe('default');
    });
});

describe('readPositiveIntParam', () => {
    it('parses valid integers', () => {
        expect(readPositiveIntParam('5', 1)).toBe(5);
    });

    it('returns fallback for invalid', () => {
        expect(readPositiveIntParam('abc', 1)).toBe(1);
        expect(readPositiveIntParam('0', 1)).toBe(1);
    });
});
