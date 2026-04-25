import { LIFECYCLE_STATUS } from './lifecycle';

/**
 * Business Status Enum — Single Source of Truth
 */
export const BUSINESS_STATUS = {
    PENDING: LIFECYCLE_STATUS.PENDING,
    LIVE: LIFECYCLE_STATUS.LIVE,
    REJECTED: LIFECYCLE_STATUS.REJECTED,
    SUSPENDED: LIFECYCLE_STATUS.SUSPENDED,
    DELETED: LIFECYCLE_STATUS.DELETED,
    // Legacy mapping (remove after migration)
    APPROVED: LIFECYCLE_STATUS.LIVE,
    ACTIVE: LIFECYCLE_STATUS.LIVE,
} as const;

export type BusinessStatusValue = (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];

/** Tuple of all valid business status values */
export const BUSINESS_STATUS_VALUES = Object.values(BUSINESS_STATUS) as [BusinessStatusValue, ...BusinessStatusValue[]];
