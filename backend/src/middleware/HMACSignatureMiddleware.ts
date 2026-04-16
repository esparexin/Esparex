import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import logger from '../utils/logger';

/**
 * Middleware to validate HMAC signatures on sensitive financial requests.
 * 
 * Header: x-signature
 * Expected Signature: HMAC-SHA256(JSONBody, env.HMAC_SECRET)
 */
export const hmacSignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // 🔒 SKIP check for safe methods or if body is missing
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const signature = req.headers['x-signature'];

    if (!signature || typeof signature !== 'string') {
        logger.warn(`[Security] Missing HMAC signature for ${req.method} ${req.originalUrl}`, {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        return res.status(403).json({
            success: false,
            message: 'Financial safety check failed: Missing request signature.'
        });
    }

    // Capture raw body for strict verification
    // Since we usually use json() middleware before this, we'll stringify it back.
    // NOTE: For absolute precision, use 'body-parser' verify hook to capture raw buffer.
    const bodyStr = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha256', env.HMAC_SECRET)
        .update(bodyStr)
        .digest('hex');

    if (signature !== expectedSignature) {
        logger.error(`[Security] Invalid HMAC signature for ${req.method} ${req.originalUrl}`, {
            received: signature,
            expected: expectedSignature,
            requestId: (req as any).requestId
        });
        return res.status(403).json({
            success: false,
            message: 'Financial safety check failed: Request tampering detected.'
        });
    }

    next();
};
