import express from 'express';
import * as paymentController from '../controllers/payment';
import { protect } from '../middleware/authMiddleware';
import { paymentWebhook } from '../controllers/admin/paymentWebhook';
import { validateObjectId } from '../middleware/validateObjectId';
import { paymentRateLimiter, searchLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import * as Validators from '../validators/finance.validator';

import { verifyPaymentWebhook } from '../middleware/verifyPaymentWebhook';
import { env } from '../config/env';

if (env.NODE_ENV === 'production') {
    const missing = (['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'] as const)
        .filter((k) => !(env[k])?.trim());
    if (missing.length > 0) {
        // Warn but don't crash — payment routes will return 503 until keys are configured
        console.warn(`[WARN] Payment routes: missing env vars: ${missing.join(', ')}. Payment features will be unavailable.`);
    }
}

const router = express.Router();


// Purchase History
router.get('/history', protect, paymentController.getPurchaseHistory);

// Get Invoice
router.get('/invoice/:id', protect, validateObjectId, paymentController.getInvoice);

import { idempotencyMiddleware } from '../middleware/idempotency';

// Create Payment Order
router.post('/orders', protect, paymentRateLimiter, idempotencyMiddleware, validateRequest(Validators.createPaymentOrderSchema), paymentController.createPaymentOrder);

// Get Available Plans
router.get('/plans', searchLimiter, paymentController.getPlans);

// Webhook (Secured by HMAC Signature)
// ⚠️  RAZORPAY_WEBHOOK_SECRET must be set in .env — passing '' causes
//     verifyPaymentWebhook to throw at startup rather than silently using a
//     placeholder secret that any attacker could exploit.
router.post(
    '/webhook',
    verifyPaymentWebhook(env.RAZORPAY_WEBHOOK_SECRET ?? ''),
    paymentWebhook
);

export default router;
