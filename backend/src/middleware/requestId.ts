/**
 * Request ID Middleware
 * 
 * Generates a unique ID for each request to track it through logs.
 * Useful for debugging and tracing requests across microservices.
 * 
 * @module middleware/requestId
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { TraceContext } from '@shared/observability/trace';

/**
 * Extend Express Request to include requestId
 */
declare module 'express-serve-static-core' {
    interface Request {
        requestId?: string;
    }
}

/**
 * Middleware to add unique request ID to each request
 * 
 * The request ID is:
 * - Generated using crypto.randomUUID()
 * - Attached to req.requestId
 * - Added to response headers as X-Request-ID
 * - Used in all logs for this request
 * 
 * @example
 * app.use(requestIdMiddleware);
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
    // 🆔 TRACE CORRELATION
    // Check for x-correlation-id (standardized across stack) or legacy x-request-id
    const correlationHeader = req.headers['x-correlation-id'] || req.headers['x-request-id'];
    const correlationId = Array.isArray(correlationHeader) ? correlationHeader[0] : correlationHeader;

    // Use current ID or generate new one
    const requestId = correlationId || randomUUID();

    // Sync with TraceContext for specialized loggers
    TraceContext.setCorrelationId(requestId);

    // Attach to request for legacy consumers
    req.requestId = requestId;

    // Add to response headers for debugging
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Correlation-ID', requestId);

    next();
}

export default requestIdMiddleware;
