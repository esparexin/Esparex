/**
 * Request Status Enum (Phone Requests, etc.)
 */

export const REQUEST_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
} as const;

export type RequestStatusValue = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];
export const REQUEST_STATUS_VALUES = Object.values(REQUEST_STATUS) as [RequestStatusValue, ...RequestStatusValue[]];
