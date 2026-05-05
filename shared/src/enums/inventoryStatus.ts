import { LIFECYCLE_STATUS } from './lifecycle';

/**
 * Inventory Status Enum — Universal SSOT for Ads, Services, and Spare Parts.
 */
export const INVENTORY_STATUS = LIFECYCLE_STATUS;

export type InventoryStatusValue = (typeof INVENTORY_STATUS)[keyof typeof INVENTORY_STATUS];

/** Tuple of all valid inventory status values */
export const INVENTORY_STATUS_VALUES = Object.values(INVENTORY_STATUS) as [InventoryStatusValue, ...InventoryStatusValue[]];
