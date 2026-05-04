"use strict";
/**
 * Payment & Invoice Status Enum
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_STATUS_VALUES = exports.PAYMENT_STATUS = void 0;
exports.PAYMENT_STATUS = {
    // Transaction/Invoice lifecycle
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    // Internal transaction sub-states
    INITIATED: 'INITIATED',
    REFUNDED: 'REFUNDED'
};
exports.PAYMENT_STATUS_VALUES = Object.values(exports.PAYMENT_STATUS);
