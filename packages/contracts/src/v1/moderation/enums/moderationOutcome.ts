/**
 * Moderation Outcome Enum — Enterprise Platform SSOT
 *
 * Represents the normalized decision outcome of the AI Moderation Platform.
 */
export const MODERATION_OUTCOME = {
    APPROVED: 'approved',
    HELD_FOR_REVIEW: 'held_for_review',
    BLOCKED: 'blocked',
    REJECTED: 'rejected',
    FAILED: 'failed',
} as const;

export type ModerationOutcomeValue = (typeof MODERATION_OUTCOME)[keyof typeof MODERATION_OUTCOME];

export const MODERATION_OUTCOME_VALUES = Object.values(MODERATION_OUTCOME) as [
    ModerationOutcomeValue,
    ...ModerationOutcomeValue[]
];
