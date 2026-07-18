/**
 * Inventory Status Enum — Universal SSOT for Ads, Services, and Spare Parts.
 */
export declare const INVENTORY_STATUS: {
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
export type InventoryStatusValue = (typeof INVENTORY_STATUS)[keyof typeof INVENTORY_STATUS];
/** Tuple of all valid inventory status values */
export declare const INVENTORY_STATUS_VALUES: [InventoryStatusValue, ...InventoryStatusValue[]];
