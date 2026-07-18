/**
 * Physical Status Enum — Universal SSOT for Spare Parts and Devices.
 */
export declare const PHYSICAL_STATUS: {
    readonly NEW: "new";
    readonly USED: "used";
    readonly REFURBISHED: "refurbished";
};
export type PhysicalStatusValue = (typeof PHYSICAL_STATUS)[keyof typeof PHYSICAL_STATUS];
/** Tuple of all valid physical status values */
export declare const PHYSICAL_STATUS_VALUES: [PhysicalStatusValue, ...PhysicalStatusValue[]];
