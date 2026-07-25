import { LIFECYCLE_STATUS } from '../../common/enums/lifecycle';

/**
 * User Status Enum — Single Source of Truth
 */
export const USER_STATUS = {
    /** Canonical user account active status */
    ACTIVE: 'active',
    /** @deprecated Use USER_STATUS.ACTIVE instead. Retained for backwards compatibility during migration. */
    LIVE: LIFECYCLE_STATUS.LIVE,
    SUSPENDED: LIFECYCLE_STATUS.SUSPENDED,
    BANNED: LIFECYCLE_STATUS.BANNED,
    DELETED: LIFECYCLE_STATUS.DELETED,
    INACTIVE: LIFECYCLE_STATUS.INACTIVE,
} as const;

export type UserStatusValue = (typeof USER_STATUS)[keyof typeof USER_STATUS];

/** Tuple of all valid user status values */
export const USER_STATUS_VALUES = Object.values(USER_STATUS) as [UserStatusValue, ...UserStatusValue[]];

