/**
 * Ad Moderation Status Enum — Single Source of Truth
 *
 * Represents the moderation pipeline state of an ad/listing.
 * This enum is shared between backend (Ad model, ModerationService)
 * and any admin tooling that needs to reference these values.
 */
export const MODERATION_STATUS = {
    /** AI/rule-based check passed — no human review required */
    AUTO_APPROVED: 'auto_approved',
    /** Flagged for human review before going live */
    HELD_FOR_REVIEW: 'held_for_review',
    /** Manually approved by a moderator */
    MANUAL_APPROVED: 'manual_approved',
    /** Rejected by a moderator — not visible to public */
    REJECTED: 'rejected',
    /** Hidden due to community reports threshold being exceeded */
    COMMUNITY_HIDDEN: 'community_hidden',
} as const;

export type ModerationStatusValue = (typeof MODERATION_STATUS)[keyof typeof MODERATION_STATUS];

/** Tuple of all valid moderation status values (for Mongoose enum + Zod) */
export const MODERATION_STATUS_VALUES = Object.values(MODERATION_STATUS) as [
    ModerationStatusValue,
    ...ModerationStatusValue[]
];
