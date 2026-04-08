
import express from 'express';
import { AuthController } from '../controllers/auth';
import { protect } from '../middleware/authMiddleware';
import { otpIpLimiter, otpSendLimiter, otpVerifyLimiter } from '../middleware/rateLimiter';
import { otpConfigurationCheck } from '../middleware/otpGuard';
import { fraudMiddleware } from '../middleware/fraudMiddleware';
import logger from '../utils/logger';

import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, verifyOtpSchema } from '../validators/auth.validator';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP for login (or signup)
 * @access  Public
 */
router.post('/send-otp', otpConfigurationCheck, validateRequest(loginSchema), otpIpLimiter, otpSendLimiter, fraudMiddleware, AuthController.login);

import { idempotencyMiddleware } from '../middleware/idempotency';

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and get token
 * @access  Public
 */
router.post('/verify-otp', otpConfigurationCheck, (req, res, next) => {
    const mobile = typeof req.body?.mobile === 'string'
        ? req.body.mobile.replace(/\D/g, '').slice(-4)
        : undefined;
    const otpLength = typeof req.body?.otp === 'string' ? req.body.otp.length : undefined;

    logger.info('[AUTH] VERIFY OTP REQUEST', {
        phone: mobile,
        otpLength,
        hasName: typeof req.body?.name === 'string' && req.body.name.trim().length > 0
    });
    next();
}, validateRequest(verifyOtpSchema), otpVerifyLimiter, fraudMiddleware, idempotencyMiddleware, AuthController.verify);

/**
 * @route   POST /api/v1/auth/cancel-otp
 * @desc    Invalidate current OTP session for a mobile number
 * @access  Public
 */
router.post('/cancel-otp', otpConfigurationCheck, validateRequest(loginSchema), AuthController.cancelOtp);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear session cookie
 * @access  Private
 */
router.post('/logout', protect, AuthController.logout);

export default router;
