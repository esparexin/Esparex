/**
 * Constants Sync Guard
 *
 * Asserts that backend GOVERNANCE does not re-define values that are
 * canonical in @shared/constants/adLimits. If this test fails, a developer
 * has introduced a duplicate constant — fix it by importing from shared instead.
 */

import { GOVERNANCE } from '../../config/constants';
import { AD_LIMITS } from '@shared/constants/adLimits';

describe('GOVERNANCE / shared constants sync', () => {
    it('GOVERNANCE.AD does not redefine AD_LIMITS.MAX_IMAGES', () => {
        expect((GOVERNANCE.AD as Record<string, unknown>).MAX_IMAGES).toBeUndefined();
    });

    it('GOVERNANCE.AD does not redefine AD_LIMITS.MIN_IMAGES', () => {
        expect((GOVERNANCE.AD as Record<string, unknown>).MIN_IMAGES).toBeUndefined();
    });

    it('GOVERNANCE.AD does not redefine AD_LIMITS.MAX_DESCRIPTION_CHARS', () => {
        expect((GOVERNANCE.AD as Record<string, unknown>).MAX_DESCRIPTION_CHARS).toBeUndefined();
    });

    it('GOVERNANCE.AD does not redefine AD_LIMITS.MAX_TITLE_CHARS', () => {
        expect((GOVERNANCE.AD as Record<string, unknown>).MAX_TITLE_LENGTH).toBeUndefined();
    });

    it('GOVERNANCE.AD does not redefine AD_LIMITS.MAX_SPARE_PARTS', () => {
        expect((GOVERNANCE.AD as Record<string, unknown>).SPARE_PARTS_MAX).toBeUndefined();
    });

    it('GOVERNANCE.AD.EXPIRY_DAYS is a positive integer (policy sanity)', () => {
        expect(typeof GOVERNANCE.AD.EXPIRY_DAYS).toBe('number');
        expect(GOVERNANCE.AD.EXPIRY_DAYS).toBeGreaterThan(0);
        expect(Number.isInteger(GOVERNANCE.AD.EXPIRY_DAYS)).toBe(true);
    });

    it('shared AD_LIMITS values are positive integers', () => {
        expect(AD_LIMITS.MIN_IMAGES).toBeGreaterThan(0);
        expect(AD_LIMITS.MAX_IMAGES).toBeGreaterThan(AD_LIMITS.MIN_IMAGES);
        expect(AD_LIMITS.MIN_TITLE_CHARS).toBeGreaterThan(0);
        expect(AD_LIMITS.MAX_TITLE_CHARS).toBeGreaterThan(AD_LIMITS.MIN_TITLE_CHARS);
        expect(AD_LIMITS.MIN_DESCRIPTION_CHARS).toBeGreaterThan(0);
        expect(AD_LIMITS.MAX_DESCRIPTION_CHARS).toBeGreaterThan(AD_LIMITS.MIN_DESCRIPTION_CHARS);
        expect(AD_LIMITS.MAX_SPARE_PARTS).toBeGreaterThan(0);
    });
});
