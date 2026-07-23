import express from 'express';
import * as paymentController from '../controllers/payment';
import { protect } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import { paymentRateLimiter, searchLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import * as Validators from '@esparex/core/validators/finance.validator';

import { verifyPaymentWebhook } from '../middleware/verifyPaymentWebhook';
import { env } from '@esparex/core/config/env';
import logger from '@esparex/core/utils/logger';

if (env.NODE_ENV === 'production') {
    const missing = (['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'] as const)
        .filter((k) => !(env[k])?.trim());
    if (missing.length > 0) {
        // Warn but don't crash — payment routes will return 503 until keys are configured
        logger.warn('Payment routes are missing required production env variables', {
            missing,
            message: 'Payment features will return 503 until keys are configured.'
        });
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

import * as creditController from '../controllers/payment/creditController';

// Credit Evaluation & Wallet Breakdown
router.post('/credits/evaluate', protect, creditController.evaluateCredits);
router.get('/credits/wallet', protect, creditController.getCreditWalletSummary);

// Get Available Plans
router.get('/plans', searchLimiter, paymentController.getPlans);


// Webhook (Secured by HMAC Signature)
// ⚠️  RAZORPAY_WEBHOOK_SECRET must be set in .env — passing '' causes
//     verifyPaymentWebhook to throw at startup rather than silently using a
//     placeholder secret that any attacker could exploit.
router.post(
    '/webhook',
    verifyPaymentWebhook(env.RAZORPAY_WEBHOOK_SECRET ?? ''),
    paymentController.paymentWebhook
);

export default router;
