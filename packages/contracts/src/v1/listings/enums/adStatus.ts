import { LISTING_STATUS, type ListingStatus } from './listingStatus';

/**
 * @deprecated Use LISTING_STATUS from ./listingStatus instead.
 * Legacy Ad Status Enum — Unified Reference
 */
export const AD_STATUS = LISTING_STATUS;

export type AdStatusValue = ListingStatus;

/** Tuple of all lifecycle status values (includes admin-only: deleted, suspended, banned, inactive) */
export const AD_STATUS_VALUES = Object.values(AD_STATUS) as [AdStatusValue, ...AdStatusValue[]];

/**
 * Display-facing ad statuses — the 6 states visible to users and schemas.
 * Use this with z.enum() in Zod schemas instead of hardcoding string literals.
 * Excludes admin-only lifecycle states (deleted, suspended, banned, inactive).
 */
export const AD_DISPLAY_STATUSES = [
    LISTING_STATUS.LIVE,
    LISTING_STATUS.PENDING,
    LISTING_STATUS.SOLD,
    LISTING_STATUS.EXPIRED,
    LISTING_STATUS.REJECTED,
    LISTING_STATUS.DEACTIVATED,
] as const;

export type AdDisplayStatus = typeof AD_DISPLAY_STATUSES[number];
export const AD_DISPLAY_STATUS_VALUES = AD_DISPLAY_STATUSES as unknown as [AdDisplayStatus, ...AdDisplayStatus[]];
