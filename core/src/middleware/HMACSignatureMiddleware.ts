import { Request, Response, NextFunction } from 'express';
import { createHmacSignatureMiddleware, type HmacRequestLike } from '@esparex/shared';
import { env } from '../config/env';
import logger from '../utils/logger';

/**
 * ESPAREX — CANONICAL HMAC SIGNATURE MIDDLEWARE (SSOT)
 * 
 * Middleware to validate HMAC signatures on sensitive financial requests.
 * 
 * Header: x-signature
 * Expected Signature: HMAC-SHA256(JSONBody, env.HMAC_SECRET)
 */
export const hmacSignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
    return createHmacSignatureMiddleware({
        secret: env.HMAC_SECRET,
        logger,
    })(req as Request & HmacRequestLike, res, next);
};
