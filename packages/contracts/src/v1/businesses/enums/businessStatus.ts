import { LIFECYCLE_STATUS } from '../../common/enums/lifecycle';

/**
 * Business Status Enum — Single Source of Truth
 */
export const BUSINESS_STATUS = {
    PENDING: LIFECYCLE_STATUS.PENDING,
    /** Canonical active business status */
    ACTIVE: 'active',
    REJECTED: LIFECYCLE_STATUS.REJECTED,
    SUSPENDED: LIFECYCLE_STATUS.SUSPENDED,
    DELETED: LIFECYCLE_STATUS.DELETED,
    EXPIRED: LIFECYCLE_STATUS.EXPIRED,
    DEACTIVATED: LIFECYCLE_STATUS.DEACTIVATED,
    CLOSED: LIFECYCLE_STATUS.CLOSED,
    /** @deprecated Use BUSINESS_STATUS.ACTIVE instead. Retained for legacy migration compatibility. */
    LIVE: LIFECYCLE_STATUS.LIVE,
    /** @deprecated Use BUSINESS_STATUS.ACTIVE instead. Retained for legacy migration compatibility. */
    APPROVED: LIFECYCLE_STATUS.LIVE,
} as const;

export type BusinessStatusValue = (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];

/** Tuple of all valid business status values */
export const BUSINESS_STATUS_VALUES = Object.values(BUSINESS_STATUS) as [BusinessStatusValue, ...BusinessStatusValue[]];

