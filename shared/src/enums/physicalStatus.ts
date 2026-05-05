/**
 * Physical Status Enum — Universal SSOT for Spare Parts and Devices.
 */

export const PHYSICAL_STATUS = {
    NEW: 'new',
    USED: 'used',
    REFURBISHED: 'refurbished',
} as const;

export type PhysicalStatusValue = (typeof PHYSICAL_STATUS)[keyof typeof PHYSICAL_STATUS];

/** Tuple of all valid physical status values */
export const PHYSICAL_STATUS_VALUES = Object.values(PHYSICAL_STATUS) as [PhysicalStatusValue, ...PhysicalStatusValue[]];
