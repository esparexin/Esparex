import { type LifecycleStatus } from '../../common/enums/lifecycle';
/**
 * Unified Listing Status Enum (SSOT)
 * Supersedes AD_STATUS, SERVICE_STATUS, and SPARE_PART_STATUS.
 * Alignment: PR #36 Canonical Refactor
 */
export declare const LISTING_STATUS: {
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
export type ListingStatus = LifecycleStatus;
/**
 * Public/Display facing statuses for listings
 */
export declare const LISTING_DISPLAY_STATUSES: readonly ["live", "pending", "sold", "expired", "rejected", "deactivated"];
export type ListingDisplayStatus = typeof LISTING_DISPLAY_STATUSES[number];
export declare const LISTING_STATUS_VALUES: [ListingStatus, ...ListingStatus[]];
export declare const LISTING_DISPLAY_STATUS_VALUES: [ListingDisplayStatus, ...ListingDisplayStatus[]];
