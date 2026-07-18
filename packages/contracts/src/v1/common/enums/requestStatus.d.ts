/**
 * Request Status Enum (Phone Requests, etc.)
 */
export declare const REQUEST_STATUS: {
    readonly PENDING: "pending";
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
};
export type RequestStatusValue = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];
export declare const REQUEST_STATUS_VALUES: [RequestStatusValue, ...RequestStatusValue[]];
