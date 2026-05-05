/**
 * Location Verification Status Enum
 */

export const LOCATION_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
} as const;

export type LocationStatusValue = (typeof LOCATION_STATUS)[keyof typeof LOCATION_STATUS];
export const LOCATION_STATUS_VALUES = Object.values(LOCATION_STATUS) as [LocationStatusValue, ...LocationStatusValue[]];
