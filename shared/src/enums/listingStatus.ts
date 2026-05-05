import { LIFECYCLE_STATUS, type LifecycleStatus } from './lifecycle';

/**
 * Unified Listing Status Enum (SSOT)
 * Supersedes AD_STATUS, SERVICE_STATUS, and SPARE_PART_STATUS.
 * Alignment: PR #36 Canonical Refactor
 */
export const LISTING_STATUS = LIFECYCLE_STATUS;

export type ListingStatus = LifecycleStatus;

/**
 * Public/Display facing statuses for listings
 */
export const LISTING_DISPLAY_STATUSES = [
    LISTING_STATUS.LIVE,
    LISTING_STATUS.PENDING,
    LISTING_STATUS.SOLD,
    LISTING_STATUS.EXPIRED,
    LISTING_STATUS.REJECTED,
    LISTING_STATUS.DEACTIVATED,
] as const;

export type ListingDisplayStatus = typeof LISTING_DISPLAY_STATUSES[number];

export const LISTING_STATUS_VALUES = Object.values(LISTING_STATUS) as [ListingStatus, ...ListingStatus[]];
export const LISTING_DISPLAY_STATUS_VALUES = LISTING_DISPLAY_STATUSES as unknown as [ListingDisplayStatus, ...ListingDisplayStatus[]];
