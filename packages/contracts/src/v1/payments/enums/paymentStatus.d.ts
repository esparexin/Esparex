/**
 * Payment & Invoice Status Enum
 */
export declare const PAYMENT_STATUS: {
    readonly PENDING: "PENDING";
    readonly SUCCESS: "SUCCESS";
    readonly FAILED: "FAILED";
    readonly CANCELLED: "CANCELLED";
    readonly INITIATED: "INITIATED";
    readonly REFUNDED: "REFUNDED";
};
export type PaymentStatusValue = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export declare const PAYMENT_STATUS_VALUES: [PaymentStatusValue, ...PaymentStatusValue[]];
