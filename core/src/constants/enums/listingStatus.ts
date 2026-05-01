import { LIFECYCLE_STATUS, type LifecycleStatus } from './lifecycle';

/**
 * Unified Listing Status Enum (Core Mirror)
 * Alignment: PR #36 Canonical Refactor
 */
export const LISTING_STATUS = LIFECYCLE_STATUS;

export type ListingStatus = LifecycleStatus;

export const LISTING_STATUS_VALUES = Object.values(LISTING_STATUS) as [ListingStatus, ...ListingStatus[]];
