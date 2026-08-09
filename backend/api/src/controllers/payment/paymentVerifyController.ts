import { Request, Response } from 'express';
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';
import { getRazorpayRuntimeConfig } from '@esparex/core/config/razorpay';
import { enqueuePaymentProcessing } from '@esparex/core/queues/paymentQueue';
import { processSuccessfulPayment } from '@esparex/core/domains/payments/application/PaymentProcessingService';
import logger, { logBusiness, logSecurity } from '@esparex/core/utils/logger';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';
import { env } from '@esparex/core/config/env';

/**
 * 🔐 VERIFY PAYMENT CONTROLLER
 * Verifies Razorpay signature for client-side completed checkouts (Mobile & Web Native).
 * Queues verified payment for processing (or processes inline if Redis queue is offline).
 */
export async function verifyPayment(req: Request, res: Response) {
    try {
        if (!req.user) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
            req.body as { razorpay_payment_id?: unknown; razorpay_order_id?: unknown; razorpay_signature?: unknown };

        if (typeof razorpay_payment_id !== 'string' || !razorpay_payment_id.trim()) {
            return sendErrorResponse(req, res, 400, 'razorpay_payment_id is required');
        }
        if (typeof razorpay_order_id !== 'string' || !razorpay_order_id.trim()) {
            return sendErrorResponse(req, res, 400, 'razorpay_order_id is required');
        }
        if (typeof razorpay_signature !== 'string' || !razorpay_signature.trim()) {
            return sendErrorResponse(req, res, 400, 'razorpay_signature is required');
        }

        const orderIdStr = razorpay_order_id.trim();
        const paymentIdStr = razorpay_payment_id.trim();
        const signatureStr = razorpay_signature.trim();

        // Mock orders: no signature verification needed
        if (orderIdStr.startsWith('order_mock_') || env.MOCK_PAYMENTS) {
            return res.json(respond({ success: true, message: 'Mock payment acknowledged' }));
        }

        const config = await getRazorpayRuntimeConfig();
        const isValid = validatePaymentVerification(
            { payment_id: paymentIdStr, order_id: orderIdStr },
            signatureStr,
            config.keySecret
        );

        if (!isValid) {
            logSecurity('payment_signature_invalid', 'high', {
                userId: req.user._id?.toString(),
                razorpay_order_id: orderIdStr,
                razorpay_payment_id: paymentIdStr
            });
            return sendErrorResponse(req, res, 400, 'Payment signature verification failed');
        }

        logBusiness('payment_verified', {
            phase: 'client_verify',
            source: 'web',
            userId: req.user._id?.toString(),
            gatewayPaymentId: paymentIdStr,
            gatewayOrderId: orderIdStr
        });

        try {
            await enqueuePaymentProcessing({
                event: 'payment.captured',
                gatewayPaymentId: paymentIdStr,
                gatewayOrderId: orderIdStr
            });
        } catch (queueErr) {
            logger.warn('[VERIFY_PAYMENT] Queue unavailable, processing payment inline:', {
                gatewayPaymentId: paymentIdStr,
                gatewayOrderId: orderIdStr,
                error: queueErr instanceof Error ? queueErr.message : String(queueErr)
            });
            await processSuccessfulPayment({
                source: 'webhook',
                event: 'payment.captured',
                gatewayPaymentId: paymentIdStr,
                gatewayOrderId: orderIdStr
            });
        }

        return res.json(respond({ success: true, message: 'Payment verified and processed successfully' }));
    } catch (error) {
        logger.error('[VERIFY_PAYMENT] Payment verification failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendErrorResponse(req, res, 500, error instanceof Error ? error.message : 'Failed to verify payment');
    }
}

