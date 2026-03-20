import { LIFECYCLE_STATUS, type LifecycleStatus } from './lifecycle';

/**
 * Ad Status Enum — Unified Reference
 */
export const AD_STATUS = LIFECYCLE_STATUS;

export type AdStatusValue = LifecycleStatus;

/** Tuple of all valid ad status values */
export const AD_STATUS_VALUES = Object.values(AD_STATUS) as [AdStatusValue, ...AdStatusValue[]];
