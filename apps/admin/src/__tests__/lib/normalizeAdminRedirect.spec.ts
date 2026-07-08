import { describe, it, expect } from 'vitest';
import { normalizeAdminRedirectUrl } from '@/lib/normalizeAdminRedirect';

describe('normalizeAdminRedirectUrl', () => {
    it('returns /dashboard for null/undefined/empty', () => {
        expect(normalizeAdminRedirectUrl(null)).toBe('/dashboard');
        expect(normalizeAdminRedirectUrl(undefined)).toBe('/dashboard');
        expect(normalizeAdminRedirectUrl('')).toBe('/dashboard');
        expect(normalizeAdminRedirectUrl('   ')).toBe('/dashboard');
    });

    it('returns /dashboard for non-root paths', () => {
        expect(normalizeAdminRedirectUrl('not-a-path')).toBe('/dashboard');
        expect(normalizeAdminRedirectUrl('http://evil.com')).toBe('/dashboard');
    });

    it('returns /dashboard for protocol-relative paths', () => {
        expect(normalizeAdminRedirectUrl('//evil.com')).toBe('/dashboard');
    });

    it('returns /dashboard for paths with CR/LF injection', () => {
        expect(normalizeAdminRedirectUrl('/dashboard\r\n')).toBe('/dashboard');
        expect(normalizeAdminRedirectUrl('/dashboard\nLocation: evil')).toBe('/dashboard');
    });

    it('passes through valid internal paths', () => {
        expect(normalizeAdminRedirectUrl('/dashboard')).toBe('/dashboard');
        expect(normalizeAdminRedirectUrl('/users')).toBe('/users');
        expect(normalizeAdminRedirectUrl('/ads?status=pending')).toBe('/ads?status=pending');
    });

    it('handles URL-encoded redirect targets', () => {
        expect(normalizeAdminRedirectUrl('/ads%3Fstatus%3Dpending')).toBe('/ads?status=pending');
    });

    it('collapses double slashes', () => {
        expect(normalizeAdminRedirectUrl('//dashboard')).toBe('/dashboard');
        expect(normalizeAdminRedirectUrl('/ads//list')).toBe('/ads/list');
    });
});
