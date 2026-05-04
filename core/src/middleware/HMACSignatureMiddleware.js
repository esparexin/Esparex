"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hmacSignatureMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("@core/config/env");
const logger_1 = __importDefault(require("@core/utils/logger"));
/**
 * ESPAREX — CANONICAL HMAC SIGNATURE MIDDLEWARE (SSOT)
 *
 * Middleware to validate HMAC signatures on sensitive financial requests.
 *
 * Header: x-signature
 * Expected Signature: HMAC-SHA256(JSONBody, env.HMAC_SECRET)
 */
const hmacSignatureMiddleware = (req, res, next) => {
    // 🔒 SKIP check for safe methods or if body is missing
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    const signature = req.headers['x-signature'];
    if (!signature || typeof signature !== 'string') {
        logger_1.default.warn(`[Security] Missing HMAC signature for ${req.method} ${req.originalUrl}`, {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        return res.status(403).json({
            success: false,
            message: 'Financial safety check failed: Missing request signature.'
        });
    }
    // Capture raw body for strict verification
    const bodyStr = JSON.stringify(req.body);
    const expectedSignature = crypto_1.default
        .createHmac('sha256', env_1.env.HMAC_SECRET)
        .update(bodyStr)
        .digest('hex');
    if (signature !== expectedSignature) {
        logger_1.default.error(`[Security] Invalid HMAC signature for ${req.method} ${req.originalUrl}`, {
            received: signature,
            expected: expectedSignature,
            requestId: req.requestId
        });
        return res.status(403).json({
            success: false,
            message: 'Financial safety check failed: Request tampering detected.'
        });
    }
    next();
};
exports.hmacSignatureMiddleware = hmacSignatureMiddleware;
//# sourceMappingURL=HMACSignatureMiddleware.js.map