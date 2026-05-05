export declare const LIFECYCLE_STATUS: {
    readonly PENDING: "pending";
    readonly LIVE: "live";
    readonly REJECTED: "rejected";
    readonly EXPIRED: "expired";
    readonly DEACTIVATED: "deactivated";
    readonly SOLD: "sold";
    readonly DELETED: "deleted";
    readonly SUSPENDED: "suspended";
    readonly BANNED: "banned";
    readonly INACTIVE: "inactive";
};
export type LifecycleStatus = typeof LIFECYCLE_STATUS[keyof typeof LIFECYCLE_STATUS];
export declare const LIFECYCLE_STATUS_VALUES: ("pending" | "live" | "rejected" | "expired" | "deactivated" | "sold" | "deleted" | "suspended" | "banned" | "inactive")[];
//# sourceMappingURL=lifecycle.d.ts.map