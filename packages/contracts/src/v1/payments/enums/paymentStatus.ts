/**
 * Payment & Invoice Status Enum
 */

export const PAYMENT_STATUS = {
    // Transaction/Invoice lifecycle
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    
    // Internal transaction sub-states
    INITIATED: 'INITIATED',
    REFUNDED: 'REFUNDED'
} as const;

export type PaymentStatusValue = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS) as [PaymentStatusValue, ...PaymentStatusValue[]];
