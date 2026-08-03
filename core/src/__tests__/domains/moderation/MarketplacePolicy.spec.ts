import { MarketplacePolicy } from '../../../domains/moderation/policy/MarketplacePolicy';
import { MODERATION_OUTCOME, RISK_LEVEL, MODERATION_REASON } from '@esparex/contracts';

describe('MarketplacePolicy Engine (PR 3)', () => {
    let policy: MarketplacePolicy;

    beforeEach(() => {
        policy = new MarketplacePolicy();
    });

    it('returns APPROVED and LOW risk for safe inputs', () => {
        const result = policy.evaluate({
            adultScore: 0.02,
            violenceScore: 0.01,
            racyScore: 0.05,
            goreScore: 0.0,
        });

        expect(result.outcome).toBe(MODERATION_OUTCOME.APPROVED);
        expect(result.riskLevel).toBe(RISK_LEVEL.LOW);
        expect(result.reasons).toHaveLength(0);
    });

    it('returns REJECTED and CRITICAL risk for explicit adult content (>0.75)', () => {
        const result = policy.evaluate({
            adultScore: 0.95,
            violenceScore: 0.05,
            racyScore: 0.80,
            goreScore: 0.0,
        });

        expect(result.outcome).toBe(MODERATION_OUTCOME.REJECTED);
        expect(result.riskLevel).toBe(RISK_LEVEL.CRITICAL);
        expect(result.reasons).toContain(MODERATION_REASON.EXPLICIT_NUDITY);
    });

    it('returns HELD_FOR_REVIEW and HIGH risk when phone number is detected in image OCR', () => {
        const result = policy.evaluate({
            adultScore: 0.05,
            violenceScore: 0.02,
            racyScore: 0.10,
            goreScore: 0.0,
            detectedPhones: ['9876543210'],
        });

        expect(result.outcome).toBe(MODERATION_OUTCOME.HELD_FOR_REVIEW);
        expect(result.riskLevel).toBe(RISK_LEVEL.HIGH);
        expect(result.reasons).toContain(MODERATION_REASON.PHONE_NUMBER_IN_IMAGE);
    });

    it('returns HELD_FOR_REVIEW for borderline adult scores (0.30 - 0.75)', () => {
        const result = policy.evaluate({
            adultScore: 0.45,
            violenceScore: 0.05,
            racyScore: 0.60,
            goreScore: 0.0,
        });

        expect(result.outcome).toBe(MODERATION_OUTCOME.HELD_FOR_REVIEW);
        expect(result.riskLevel).toBe(RISK_LEVEL.HIGH);
        expect(result.reasons).toContain(MODERATION_REASON.EXPLICIT_NUDITY);
    });
});
