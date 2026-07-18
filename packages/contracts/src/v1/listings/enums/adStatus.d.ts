import { type ListingStatus } from './listingStatus';
/**
 * @deprecated Use LISTING_STATUS from ./listingStatus instead.
 * Legacy Ad Status Enum — Unified Reference
 */
export declare const AD_STATUS: {
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
export type AdStatusValue = ListingStatus;
/** Tuple of all lifecycle status values (includes admin-only: deleted, suspended, banned, inactive) */
export declare const AD_STATUS_VALUES: [AdStatusValue, ...AdStatusValue[]];
/**
 * Display-facing ad statuses — the 6 states visible to users and schemas.
 * Use this with z.enum() in Zod schemas instead of hardcoding string literals.
 * Excludes admin-only lifecycle states (deleted, suspended, banned, inactive).
 */
export declare const AD_DISPLAY_STATUSES: readonly ["live", "pending", "sold", "expired", "rejected", "deactivated"];
export type AdDisplayStatus = typeof AD_DISPLAY_STATUSES[number];
export declare const AD_DISPLAY_STATUS_VALUES: [AdDisplayStatus, ...AdDisplayStatus[]];
