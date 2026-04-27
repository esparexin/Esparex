"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesGatewayAmount = exports.normalizeGatewayCurrency = exports.GatewayService = void 0;
const razorpay_1 = require("@core/config/razorpay");
const logger_1 = __importDefault(require("@core/utils/logger"));
/**
 * 💳 PAYMENT GATEWAY SERVICE
 * Handles interactions with Razorpay and mock gateways.
 */
class GatewayService {
    /**
     * Finds a captured payment for a given order ID.
     */
    static async findCapturedPaymentForOrder(gatewayOrderId) {
        const razorpay = await (0, razorpay_1.getRazorpayClient)();
        // Razorpay SDK typings don't include fetchPayments; cast to an extended interface
        const ordersApi = razorpay.orders;
        if (!ordersApi.fetchPayments)
            return undefined;
        try {
            const paymentList = await ordersApi.fetchPayments(gatewayOrderId);
            const items = (paymentList?.items || []);
            return items.find((item) => item.status === 'captured') || items[0];
        }
        catch (error) {
            logger_1.default.warn('Failed to fetch payments for order', { gatewayOrderId, error });
            return undefined;
        }
    }
    /**
     * Fetches the outcome of a transaction from the gateway to assist in recovery.
     */
    static async fetchRecoveryOutcome(tx) {
        if (tx.paymentGateway === 'mock') {
            return { status: 'failed', reason: 'mock_transaction_expired' };
        }
        if (!tx.gatewayOrderId) {
            return { status: 'unresolved', reason: 'missing_gateway_order_id' };
        }
        try {
            const razorpay = await (0, razorpay_1.getRazorpayClient)();
            const order = await razorpay.orders.fetch(tx.gatewayOrderId);
            if (order.status === 'paid') {
                const payment = tx.gatewayPaymentId
                    ? await razorpay.payments.fetch(tx.gatewayPaymentId)
                    : await this.findCapturedPaymentForOrder(tx.gatewayOrderId);
                return {
                    status: 'success',
                    gatewayOrderId: tx.gatewayOrderId,
                    gatewayPaymentId: payment?.id || tx.gatewayPaymentId,
                    gatewayAmountPaise: this.toNumericAmount(payment?.amount) ?? (order.amount || 0),
                    gatewayCurrency: (payment?.currency || order.currency || 'INR').toUpperCase()
                };
            }
            if (['created', 'attempted'].includes(order.status || '')) {
                return { status: 'failed', reason: `gateway_order_${order.status}` };
            }
            return { status: 'unresolved', reason: `gateway_order_${order.status}` };
        }
        catch (error) {
            logger_1.default.error('Failed to fetch gateway recovery outcome', {
                transactionId: tx._id.toString(),
                gatewayOrderId: tx.gatewayOrderId,
                error: error instanceof Error ? error.message : String(error)
            });
            return { status: 'unresolved', reason: 'gateway_api_error' };
        }
    }
    static toNumericAmount(value) {
        if (typeof value === 'number' && Number.isFinite(value))
            return value;
        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
    }
}
exports.GatewayService = GatewayService;
const normalizeGatewayCurrency = (currency) => (currency || 'INR').toUpperCase();
exports.normalizeGatewayCurrency = normalizeGatewayCurrency;
const matchesGatewayAmount = (tx, gatewayAmountPaise) => {
    if (!Number.isFinite(gatewayAmountPaise))
        return true;
    return Math.round(tx.amount * 100) === gatewayAmountPaise;
};
exports.matchesGatewayAmount = matchesGatewayAmount;
// Legacy exports for backward compatibility if needed, though they should be migrated to static class methods.
//# sourceMappingURL=GatewayService.js.map