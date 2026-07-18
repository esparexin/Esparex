/**
 * User Status Enum — Single Source of Truth
 */
export declare const USER_STATUS: {
    LIVE: "live";
    SUSPENDED: "suspended";
    BANNED: "banned";
    DELETED: "deleted";
    INACTIVE: "inactive";
};
export type UserStatusValue = (typeof USER_STATUS)[keyof typeof USER_STATUS];
/** Tuple of all valid user status values */
export declare const USER_STATUS_VALUES: [UserStatusValue, ...UserStatusValue[]];
