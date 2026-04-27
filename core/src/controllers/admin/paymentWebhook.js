"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentWebhook = paymentWebhook;
const logger_1 = __importDefault(require("@core/utils/logger"));
const errorResponse_1 = require("@core/utils/errorResponse");
const respond_1 = require("@core/utils/respond");
const paymentQueue_1 = require("@core/queues/paymentQueue");
const logger_2 = require("@core/utils/logger");
/**
 * 📡 IDEMPOTENT PAYMENT WEBHOOK CONTROLLER
 * Processes verified payment events from the gateway.
 * Prevents double-crediting via 'applied' flag.
 */
async function paymentWebhook(req, res) {
    const sendWebhookSuccess = (message) => (res.status(200).json((0, respond_1.respond)({
        success: true,
        message
    })));
    const body = req.body;
    const { event, payload } = body;
    // Razorpay sends event name: 'payment.captured' or 'order.paid' etc.
    if (!event || !payload) {
        return (0, errorResponse_1.sendErrorResponse)(req, res, 400, "Invalid webhook payload structure");
    }
    const webhookSignature = req.headers['x-razorpay-signature'];
    if (!webhookSignature) {
        return (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Missing webhook signature');
    }
    // Extract payment ID from payload
    const payment = payload.payment?.entity ?? payload.order?.entity;
    const payment_id = payment?.id ?? body.payment_id; // Fallback to root for legacy/test
    const order_id = payload.order?.entity?.id ?? payment?.order_id ?? body.order_id;
    // Only process successful capture events
    if (event !== "payment.captured" && event !== "order.paid") {
        return sendWebhookSuccess(`Event ignored: ${event}`);
    }
    try {
        (0, logger_2.logBusiness)("webhook_received", {
            event,
            gatewayPaymentId: payment_id,
            gatewayOrderId: order_id
        });
        await (0, paymentQueue_1.enqueuePaymentProcessing)({
            event,
            gatewayPaymentId: payment_id,
            gatewayOrderId: order_id,
            gatewayAmountPaise: Number.isFinite(payment?.amount) ? payment?.amount : undefined,
            gatewayCurrency: typeof payment?.currency === "string" ? payment.currency : undefined
        });
        return sendWebhookSuccess('Payment webhook accepted for processing');
    }
    catch (error) {
        logger_1.default.error(`[PAYMENT CRITICAL ERROR] Failed to queue webhook for ${payment_id}:`, error);
        return (0, errorResponse_1.sendErrorResponse)(req, res, 500, "Internal processing failure");
    }
}
//# sourceMappingURL=paymentWebhook.js.map