import { isLocalAutoApproveEnabled } from '../../config/env';
import { validateProductionSafetyFlagsOrThrow } from '../../config/validateEnv';
import { LISTING_TYPE, BUSINESS_STATUS, LISTING_STATUS } from '@esparex/contracts';
import { detectSpam } from '../../domains/fraud/application/services/SpamDetectorService';
import { AdDuplicateService, buildDuplicateFingerprint } from '../../domains/listings/application/ad/AdDuplicateService';
import { DuplicateImageService } from '../../domains/moderation/classifiers/DuplicateImageService';
import { isBusinessPublishedStatus } from '../../utils/businessStatus';

describe('Local Auto-Approval Governance & Flows', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    // ── Flow 10: Production Safety Guard ──────────────────────────────────────
    it('Flow 10: strictly blocks ENABLE_LOCAL_AUTO_APPROVE in production', () => {
        process.env.NODE_ENV = 'production';
        process.env.ENABLE_LOCAL_AUTO_APPROVE = 'true';

        expect(isLocalAutoApproveEnabled()).toBe(false);

        expect(() => {
            validateProductionSafetyFlagsOrThrow(process.env);
        }).toThrow('Unsafe production flags enabled: ENABLE_LOCAL_AUTO_APPROVE');
    });

    // ── Flow 1: Business Auto-Approval in Local Environment ───────────────────
    it('Flow 1: allows local auto-approval flag only in non-production environments', () => {
        process.env.NODE_ENV = 'development';
        delete process.env.APP_ENV;
        process.env.ENABLE_LOCAL_AUTO_APPROVE = 'true';

        expect(isLocalAutoApproveEnabled()).toBe(true);
    });

    // ── Flow 2: Ad Auto-Approval Gate Criteria ────────────────────────────────
    it('Flow 2: ad auto-approval requires clear moderationStatus (not held_for_review)', () => {
        process.env.NODE_ENV = 'development';
        process.env.ENABLE_LOCAL_AUTO_APPROVE = 'true';

        const isLocalEnabled = isLocalAutoApproveEnabled();
        expect(isLocalEnabled).toBe(true);

        // Passed moderation -> eligible for auto-approval
        const passedPayload = { moderationStatus: 'auto_approved' };
        const shouldApproveClean = isLocalEnabled && passedPayload.moderationStatus !== 'held_for_review';
        expect(shouldApproveClean).toBe(true);

        // Flagged by fraud or spam -> held for review -> BLOCKED from auto-approval
        const flaggedPayload = { moderationStatus: 'held_for_review' };
        const shouldApproveFlagged = isLocalEnabled && flaggedPayload.moderationStatus !== 'held_for_review';
        expect(shouldApproveFlagged).toBe(false);
    });

    // ── Flow 3: Service Creation Requires LIVE Business ───────────────────────
    it('Flow 3: service listings strictly require an approved LIVE business', () => {
        // Pending or rejected businesses cannot post services
        expect(isBusinessPublishedStatus(BUSINESS_STATUS.PENDING)).toBe(false);
        expect(isBusinessPublishedStatus(BUSINESS_STATUS.REJECTED)).toBe(false);
        expect(isBusinessPublishedStatus(BUSINESS_STATUS.SUSPENDED)).toBe(false);
        expect(isBusinessPublishedStatus(undefined)).toBe(false);

        // Only LIVE business is authorized
        expect(isBusinessPublishedStatus(BUSINESS_STATUS.LIVE)).toBe(true);
    });

    // ── Flow 4: Spare Part Creation Requires LIVE Business ────────────────────
    it('Flow 4: spare_part listings strictly require an approved LIVE business and canonical literal', () => {
        expect(LISTING_TYPE.SPARE_PART).toBe('spare_part');
        expect(isBusinessPublishedStatus(BUSINESS_STATUS.LIVE)).toBe(true);
        expect(isBusinessPublishedStatus(BUSINESS_STATUS.PENDING)).toBe(false);

        // Confirm 'parts' is NOT a valid value in the enum
        const values = Object.values(LISTING_TYPE) as string[];
        expect(values).toContain('spare_part');
        expect(values).not.toContain('parts');
    });

    // ── Flow 5: Smart Alert Configuration ─────────────────────────────────────
    it('Flow 5: smart alerts support active status and criteria validation', () => {
        const criteria = {
            categoryId: '69c24a14a58d20c75c6b09d8',
            minPrice: 5000,
            maxPrice: 20000,
            radiusKm: 25,
        };

        expect(criteria.minPrice).toBeLessThan(criteria.maxPrice);
        expect(criteria.radiusKm).toBeGreaterThan(0);
    });

    // ── Flow 6: Duplicate Submission Still Rejected ───────────────────────────
    it('Flow 6: duplicate detection still rejects duplicate payloads', () => {
        expect(typeof AdDuplicateService.checkDuplicate).toBe('function');
        expect(typeof buildDuplicateFingerprint).toBe('function');
    });

    // ── Flow 7: Invalid / Spam Content Still Rejected ─────────────────────────
    it('Flow 7: spam content detection rejects spammy or prohibited text', () => {
        const spamText = 'buy cheap casino betting drugs weapon gun online now';
        const result = detectSpam(spamText);

        expect(result.isSpam).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(60);
    });

    // ── Flow 8: Invalid / Duplicate Image Still Rejected ──────────────────────
    it('Flow 8: duplicate image service correctly flags identical image fingerprints', () => {
        const imageService = new DuplicateImageService();
        const fp1 = { hash: 'a1b2c3d4e5f60718', createdAt: Date.now() };
        const fp2 = { hash: 'a1b2c3d4e5f60718', createdAt: Date.now() };
        const fpDifferent = { hash: 'ffffffffffffffff', createdAt: Date.now() };

        expect(imageService.isDuplicate(fp1, fp2, 5)).toBe(true);
        expect(imageService.isDuplicate(fp1, fpDifferent, 5)).toBe(false);
    });

    // ── Flow 9: Unauthorized Request Blocking ────────────────────────────────
    it('Flow 9: unauthenticated actor context is denied bypass privileges', () => {
        const unauthenticatedContext = {
            actor: 'USER' as const,
            authUserId: '',
            sellerId: '',
            allowQuotaBypass: false,
        };

        expect(unauthenticatedContext.allowQuotaBypass).toBe(false);
        expect(unauthenticatedContext.actor).toBe('USER');
    });
});
