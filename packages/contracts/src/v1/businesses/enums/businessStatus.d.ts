/**
 * Business Status Enum — Single Source of Truth
 */
export declare const BUSINESS_STATUS: {
    readonly PENDING: "pending";
    readonly LIVE: "live";
    readonly REJECTED: "rejected";
    readonly SUSPENDED: "suspended";
    readonly DELETED: "deleted";
    readonly EXPIRED: "expired";
    readonly DEACTIVATED: "deactivated";
    readonly CLOSED: "closed";
    readonly APPROVED: "live";
    readonly ACTIVE: "live";
};
export type BusinessStatusValue = (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];
/** Tuple of all valid business status values */
export declare const BUSINESS_STATUS_VALUES: [BusinessStatusValue, ...BusinessStatusValue[]];
