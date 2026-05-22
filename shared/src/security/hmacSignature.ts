import crypto from 'crypto';

export interface HmacRequestLike {
    method: string;
    originalUrl?: string;
    ip?: string;
    headers: {
        'x-signature'?: string | string[];
        'user-agent'?: string | string[];
    };
    body: unknown;
    requestId?: string;
}

export interface HmacFailureResponse {
    success: false;
    message: string;
}

export interface HmacResponseLike {
    status: (code: number) => {
        json: (payload: HmacFailureResponse) => unknown;
    };
}

export interface HmacLoggerLike {
    warn: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
}

export type HmacNextFunction = () => void;

export interface HmacSignatureMiddlewareOptions {
    secret: string;
    logger: HmacLoggerLike;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function createHmacSignatureMiddleware<
    TRequest extends HmacRequestLike,
    TResponse extends HmacResponseLike,
>({ secret, logger }: HmacSignatureMiddlewareOptions) {
    return (req: TRequest, res: TResponse, next: HmacNextFunction) => {
        if (SAFE_METHODS.has(req.method)) {
            return next();
        }

        const signature = req.headers['x-signature'];
        const requestPath = req.originalUrl ?? '';

        if (!signature || typeof signature !== 'string') {
            logger.warn(`[Security] Missing HMAC signature for ${req.method} ${requestPath}`, {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            return res.status(403).json({
                success: false,
                message: 'Financial safety check failed: Missing request signature.',
            });
        }

        const bodyStr = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(bodyStr)
            .digest('hex');

        if (signature !== expectedSignature) {
            logger.error(`[Security] Invalid HMAC signature for ${req.method} ${requestPath}`, {
                received: signature,
                expected: expectedSignature,
                requestId: req.requestId,
            });
            return res.status(403).json({
                success: false,
                message: 'Financial safety check failed: Request tampering detected.',
            });
        }

        return next();
    };
}
