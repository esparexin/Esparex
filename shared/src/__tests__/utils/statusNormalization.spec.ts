import { describe, it, expect } from 'vitest';
import { normalizeStatus, normalizeAdStatus, normalizeBusinessStatus, normalizeServiceStatus } from '../../utils/statusNormalization';

describe('normalizeStatus', () => {
    it('returns live for approved', () => {
        expect(normalizeStatus('approved')).toBe('live');
    });

    it('returns live for active', () => {
        expect(normalizeStatus('active')).toBe('live');
    });

    it('returns live for live', () => {
        expect(normalizeStatus('live')).toBe('live');
    });

    it('returns pending for unknown values', () => {
        expect(normalizeStatus('unknown')).toBe('pending');
    });

    it('returns fallback for non-string', () => {
        expect(normalizeStatus(null, 'live')).toBe('live');
        expect(normalizeStatus(undefined)).toBe('pending');
    });

    it('trims and lowercases', () => {
        expect(normalizeStatus('  APPROVED  ')).toBe('live');
    });

    it('passes through valid statuses', () => {
        expect(normalizeStatus('rejected')).toBe('rejected');
        expect(normalizeStatus('sold')).toBe('sold');
        expect(normalizeStatus('expired')).toBe('expired');
    });
});

describe('normalizeAdStatus', () => {
    it('returns live for approved', () => {
        expect(normalizeAdStatus('approved')).toBe('live');
    });

    it('maps suspended to pending', () => {
        expect(normalizeAdStatus('suspended')).toBe('pending');
    });

    it('passes through valid ad statuses', () => {
        expect(normalizeAdStatus('sold')).toBe('sold');
        expect(normalizeAdStatus('expired')).toBe('expired');
    });
});

describe('normalizeBusinessStatus', () => {
    it('returns live for active', () => {
        expect(normalizeBusinessStatus('active')).toBe('live');
    });

    it('maps sold to closed', () => {
        expect(normalizeBusinessStatus('sold')).toBe('closed');
    });
});

describe('normalizeServiceStatus', () => {
    it('maps suspended and sold to pending', () => {
        expect(normalizeServiceStatus('suspended')).toBe('pending');
        expect(normalizeServiceStatus('sold')).toBe('pending');
    });
});
