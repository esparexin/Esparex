import logger from '../../utils/logger';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';
// backend/src/controllers/admin/paymentWebhook.ts
import { Request, Response } from "express";
import { enqueuePaymentProcessing } from "../../queues/paymentQueue";
import { logBusiness } from "../../utils/logger";

/**
 * 📡 IDEMPOTENT PAYMENT WEBHOOK CONTROLLER
 * Processes verified payment events from the gateway.
 * Prevents double-crediting via 'applied' flag.
 */
export async function paymentWebhook(req: Request, res: Response) {
    const sendWebhookSuccess = (message: string) => (
        res.status(200).json(respond({
            success: true,
            message
        }))
    );

    const { event, payload } = req.body;

    // Razorpay sends event name: 'payment.captured' or 'order.paid' etc.
    if (!event || !payload) {
        return sendErrorResponse(req, res, 400, "Invalid webhook payload structure");
    }

    const webhookSignature = req.headers['x-razorpay-signature'];
    if (!webhookSignature) {
        return sendErrorResponse(req, res, 400, 'Missing webhook signature');
    }

    // Extract payment ID from payload
    const payment = payload.payment?.entity || payload.order?.entity;
    const payment_id = payment?.id || req.body.payment_id; // Fallback to root for legacy/test
    const order_id = payload.order?.entity?.id || payment?.order_id || req.body.order_id;

    // Only process successful capture events
    if (event !== "payment.captured" && event !== "order.paid") {
        return sendWebhookSuccess(`Event ignored: ${event}`);
    }

    try {
        logBusiness("webhook_received", {
            event,
            gatewayPaymentId: payment_id,
            gatewayOrderId: order_id
        });

        await enqueuePaymentProcessing({
            event,
            gatewayPaymentId: payment_id,
            gatewayOrderId: order_id,
            gatewayAmountPaise: Number.isFinite(payment?.amount) ? payment.amount : undefined,
            gatewayCurrency: typeof payment?.currency === "string" ? payment.currency : undefined
        });

        return sendWebhookSuccess('Payment webhook accepted for processing');
    } catch (error) {
        logger.error(`[PAYMENT CRITICAL ERROR] Failed to queue webhook for ${payment_id}:`, error);
        return sendErrorResponse(req, res, 500, "Internal processing failure");
    }
}
