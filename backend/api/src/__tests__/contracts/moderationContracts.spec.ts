import {
    MODERATION_OUTCOME,
    RISK_LEVEL,
    MODERATION_REASON,
    ModerationResultSchema,
    ImageModeratedEventSchema,
} from '@esparex/contracts';

describe('Moderation Contracts (PR 1)', () => {
    it('defines valid ModerationOutcome enum values', () => {
        expect(MODERATION_OUTCOME.APPROVED).toBe('approved');
        expect(MODERATION_OUTCOME.HELD_FOR_REVIEW).toBe('held_for_review');
        expect(MODERATION_OUTCOME.BLOCKED).toBe('blocked');
        expect(MODERATION_OUTCOME.REJECTED).toBe('rejected');
        expect(MODERATION_OUTCOME.FAILED).toBe('failed');
    });

    it('defines valid RiskLevel enum values', () => {
        expect(RISK_LEVEL.LOW).toBe('low');
        expect(RISK_LEVEL.MEDIUM).toBe('medium');
        expect(RISK_LEVEL.HIGH).toBe('high');
        expect(RISK_LEVEL.CRITICAL).toBe('critical');
    });

    it('validates a ModerationResult payload', () => {
        const validPayload = {
            outcome: MODERATION_OUTCOME.HELD_FOR_REVIEW,
            riskLevel: RISK_LEVEL.HIGH,
            reasons: [MODERATION_REASON.EXPLICIT_NUDITY, MODERATION_REASON.PHONE_NUMBER_IN_IMAGE],
            signals: [
                { classifier: 'SafetyClassifier', score: 0.92, details: { category: 'adult' } },
                { classifier: 'OCRService', score: 0.88, details: { phone: '9876543210' } },
            ],
            metadata: { provider: 'GoogleVisionProvider' },
        };

        const result = ModerationResultSchema.parse(validPayload);
        expect(result.outcome).toBe('held_for_review');
        expect(result.riskLevel).toBe('high');
        expect(result.reasons).toHaveLength(2);
    });

    it('validates an ImageModeratedEvent payload', () => {
        const validEvent = {
            imageId: 'img-123',
            entityId: 'ad-456',
            entityType: 'ad' as const,
            result: {
                outcome: MODERATION_OUTCOME.APPROVED,
                riskLevel: RISK_LEVEL.LOW,
                reasons: [],
                signals: [{ classifier: 'SafetyClassifier', score: 0.05 }],
            },
            timestamp: 1770000000000,
        };

        const parsed = ImageModeratedEventSchema.parse(validEvent);
        expect(parsed.imageId).toBe('img-123');
        expect(parsed.result.outcome).toBe('approved');
    });
});
