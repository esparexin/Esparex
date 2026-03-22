import { LIFECYCLE_STATUS, type LifecycleStatus } from './lifecycle';

/**
 * Ad Status Enum — Unified Reference
 */
export const AD_STATUS = LIFECYCLE_STATUS;

export type AdStatusValue = LifecycleStatus;

/** Tuple of all lifecycle status values (includes admin-only: deleted, suspended, banned, inactive) */
export const AD_STATUS_VALUES = Object.values(AD_STATUS) as [AdStatusValue, ...AdStatusValue[]];

/**
 * Display-facing ad statuses — the 6 states visible to users and schemas.
 * Use this with z.enum() in Zod schemas instead of hardcoding string literals.
 * Excludes admin-only lifecycle states (deleted, suspended, banned, inactive).
 */
export const AD_DISPLAY_STATUSES = [
    LIFECYCLE_STATUS.LIVE,
    LIFECYCLE_STATUS.PENDING,
    LIFECYCLE_STATUS.SOLD,
    LIFECYCLE_STATUS.EXPIRED,
    LIFECYCLE_STATUS.REJECTED,
    LIFECYCLE_STATUS.DEACTIVATED,
] as const;

export type AdDisplayStatus = typeof AD_DISPLAY_STATUSES[number];
export const AD_DISPLAY_STATUS_VALUES = AD_DISPLAY_STATUSES as unknown as [AdDisplayStatus, ...AdDisplayStatus[]];
