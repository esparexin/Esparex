/**
 * User Status Enum — Single Source of Truth
 */
export declare const USER_STATUS: {
    readonly LIVE: "live";
    readonly SUSPENDED: "suspended";
    readonly BANNED: "banned";
    readonly DELETED: "deleted";
    readonly INACTIVE: "inactive";
    readonly ACTIVE: "live";
};
export type UserStatusValue = (typeof USER_STATUS)[keyof typeof USER_STATUS];
/** Tuple of all valid user status values */
export declare const USER_STATUS_VALUES: [UserStatusValue, ...UserStatusValue[]];
