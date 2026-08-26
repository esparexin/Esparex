/**
 * Unified Lifecycle Status Enum (SSOT)
 * Authoritative taxonomy for entity lifecycles across the Esparex Platform.
 * 
 * Governance Taxonomy Rules:
 * 1. Listings / Ads: CANONICAL write status for public display is `LIVE` ('live').
 *    - Legacy aliases ('active', 'approved', 'published') are deprecated for writes and auto-expanded on reads.
 * 2. User & Business Accounts: CANONICAL active status is `ACTIVE` ('active').
 * 3. Account Moderation / Blocking: Use `SUSPENDED` ('suspended') or `BANNED` ('banned') — never use ad-hoc 'blocked'.
 * 4. Content Moderation: Use `MODERATION_STATUS` ('auto_approved', 'held_for_review', 'manual_approved', 'rejected', 'community_hidden').
 */
export const LIFECYCLE_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',

    /**
     * CANONICAL write-side status for a publicly-visible listing.
     * All approval flows MUST write this value. Never write ACTIVE, APPROVED, or PUBLISHED.
     */
    LIVE: 'live',

    /**
     * @deprecated Legacy alias for LIVE in listings. Present only for backward compatibility with
     * MongoDB documents written before PR #36. Do NOT use in new listing write paths.
     * (Note: For User & Business accounts, 'active' remains the canonical active status).
     */
    ACTIVE: 'active',

    /**
     * @deprecated Legacy alias for LIVE. Present only for backward compatibility with
     * MongoDB documents written before the lifecycle enum was introduced.
     * Do NOT use in new write paths. Use LISTING_STATUS.LIVE.
     */
    APPROVED: 'approved',

    /**
     * @deprecated Legacy alias for LIVE. Present only for backward compatibility with
     * MongoDB documents written during the early publish-state naming era.
     * Do NOT use in new write paths. Use LISTING_STATUS.LIVE.
     */
    PUBLISHED: 'published',

    REJECTED: 'rejected',
    EXPIRED: 'expired',
    DEACTIVATED: 'deactivated',
    SOLD: 'sold',
    CLOSED: 'closed',
    DELETED: 'deleted',

    /** Temporary restriction / hold placed on listing or account */
    SUSPENDED: 'suspended',
    /** Permanent ban placed on user account or listing (canonical for "blocked") */
    BANNED: 'banned',
    INACTIVE: 'inactive',
} as const;

export type LifecycleStatus = typeof LIFECYCLE_STATUS[keyof typeof LIFECYCLE_STATUS];
export const LIFECYCLE_STATUS_VALUES = Object.values(LIFECYCLE_STATUS);


