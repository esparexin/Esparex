// backend/src/middleware/verifyPaymentWebhook.ts
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import logger from '../utils/logger';
import { sendErrorResponse } from '../utils/errorResponse';
import { env } from '../config/env';

/**
 * 🔐 PAYMENT WEBHOOK VERIFIER (HMAC)
 * ---------------------------------
 * RULES:
 * - MUST use raw body (express.raw)
 * - NO auth middleware here
 * - NO rate limiting here
 * - NO DB access
 * - Sync crypto only
 */
export function verifyPaymentWebhook(secret: string) {
    const isProd = env.NODE_ENV === 'production';

    if (!secret) {
        if (isProd) {
            // 🔴 Hard fail in production — a missing secret means forged webhooks
            // can credit arbitrary wallets. Refuse to start.
            throw new Error("Payment webhook secret is missing. Set RAZORPAY_WEBHOOK_SECRET in your environment.");
        }
        // ⚠️ In development/test, warn and return a middleware that rejects all
        // webhook requests with 503 rather than crashing the server.
        logger.warn("⚠️  [Webhook] RAZORPAY_WEBHOOK_SECRET not set. Webhook endpoint disabled in development.");
        return (req: Request, res: Response) => {
            sendErrorResponse(req, res, 503, "Webhook not configured in this environment");
        };
    }

    return (req: Request, res: Response, next: NextFunction) => {
        // Webhook signature headers (gateway-dependent)
        const signatureHeader =
            req.headers["x-razorpay-signature"] ||
            req.headers["x-webhook-signature"];

        const signature =
            typeof signatureHeader === "string"
                ? signatureHeader
                : Array.isArray(signatureHeader)
                    ? signatureHeader[0]
                    : null;

        if (!signature) {
            return sendErrorResponse(req, res, 401, "Missing webhook signature");
        }

        // 🌐 IP Whitelist Verification (Razorpay IP Range)
        const allowedIps = [
            '14.97.75.20',
            '14.97.75.21',
            '14.97.75.22',
            '127.0.0.1', // localhost proxy bridging allowed via Nginx safely typically
            '::1'
        ];

        // If running behind a proxy, express app trust proxy guarantees req.ip is extracted correctly
        const requestIp = req.ip || req.connection.remoteAddress;

        if (isProd && requestIp && !allowedIps.includes(requestIp)) {
            logger.warn(`🚨 Unauthorized Webhook IP Attempt detected: ${requestIp}`);
            return sendErrorResponse(req, res, 403, "Origin validation failed");
        }

        // 🛡️ DEV BYPASS: Allow mock signature only in local development (not CI/staging)
        if (
            env.NODE_ENV === 'development' &&
            !env.CI &&
            signature === 'mock_verif_bypass'
        ) {
            logger.warn('⚠️ Webhook Signature Check BYPASSED (Development Mode)');
            return next();
        }

        // 🔑 IMPORTANT: Use rawBody if available (from app.ts), else check req.body
        const request = req as Request & { rawBody?: Buffer };
        const body: Buffer | unknown = request.rawBody || (req.body as Buffer | undefined);

        if (!Buffer.isBuffer(body)) {
            logger.error("[Webhook] Invalid body type. Raw body (Buffer) required.");
            // Log what we received (debug)
            logger.error("Received Type:", typeof body);
            return sendErrorResponse(req, res, 400, "Invalid webhook configuration", {
                details: {
                    message: "Raw body parser is required for webhook verification",
                }
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        const expectedBuffer = Buffer.from(expectedSignature, "utf8");
        const receivedBuffer = Buffer.from(signature, "utf8");

        if (
            expectedBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
        ) {
            return sendErrorResponse(req, res, 401, "Invalid webhook signature");
        }

        // ✅ Signature valid → continue
        return next();
    };
}
