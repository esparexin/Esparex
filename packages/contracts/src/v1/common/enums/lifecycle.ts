export const LIFECYCLE_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',

    /**
     * CANONICAL write-side status for a publicly-visible listing.
     * All approval flows MUST write this value. Never write ACTIVE, APPROVED, or PUBLISHED.
     */
    LIVE: 'live',

    /**
     * @deprecated Legacy alias for LIVE. Present only for backward compatibility with
     * MongoDB documents written before PR #36. Do NOT use in new write paths or queries.
     * Always use LISTING_STATUS.LIVE for writes and getStatusMatchCriteria('live') for reads.
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

    SUSPENDED: 'suspended',
    BANNED: 'banned',
    INACTIVE: 'inactive',
} as const;

export type LifecycleStatus = typeof LIFECYCLE_STATUS[keyof typeof LIFECYCLE_STATUS];
export const LIFECYCLE_STATUS_VALUES = Object.values(LIFECYCLE_STATUS);

