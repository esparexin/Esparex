/**
 * Location Verification Status Enum
 */
export declare const LOCATION_STATUS: {
    readonly PENDING: "pending";
    readonly VERIFIED: "verified";
    readonly REJECTED: "rejected";
};
export type LocationStatusValue = (typeof LOCATION_STATUS)[keyof typeof LOCATION_STATUS];
export declare const LOCATION_STATUS_VALUES: [LocationStatusValue, ...LocationStatusValue[]];
