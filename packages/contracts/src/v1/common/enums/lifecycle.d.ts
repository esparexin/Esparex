export declare const LIFECYCLE_STATUS: {
    readonly PENDING: "pending";
    readonly LIVE: "live";
    readonly ACTIVE: "active";
    readonly REJECTED: "rejected";
    readonly EXPIRED: "expired";
    readonly DEACTIVATED: "deactivated";
    readonly SOLD: "sold";
    readonly CLOSED: "closed";
    readonly DELETED: "deleted";
    readonly SUSPENDED: "suspended";
    readonly BANNED: "banned";
    readonly INACTIVE: "inactive";
};
export type LifecycleStatus = typeof LIFECYCLE_STATUS[keyof typeof LIFECYCLE_STATUS];
export declare const LIFECYCLE_STATUS_VALUES: ("closed" | "live" | "suspended" | "banned" | "deleted" | "inactive" | "active" | "expired" | "pending" | "rejected" | "deactivated" | "sold")[];
