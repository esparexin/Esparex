export const LIFECYCLE_STATUS = {
    PENDING: 'pending',
    LIVE: 'live',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    DEACTIVATED: 'deactivated',
    SOLD: 'sold',
    DELETED: 'deleted',
    SUSPENDED: 'suspended',
    BANNED: 'banned',
    INACTIVE: 'inactive',
} as const;

export type LifecycleStatus = typeof LIFECYCLE_STATUS[keyof typeof LIFECYCLE_STATUS];
export const LIFECYCLE_STATUS_VALUES = Object.values(LIFECYCLE_STATUS);
