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
    // Check if request ID already exists in headers (from load balancer/proxy)
    // Express lowercases headers in runtime, but tests may provide mixed-case keys.
    const existingHeaderValue = Object.entries(req.headers).find(
        ([headerName, headerValue]) =>
            headerName.toLowerCase() === 'x-request-id' &&
            (typeof headerValue === 'string' || Array.isArray(headerValue))
    )?.[1];
    const existingId = Array.isArray(existingHeaderValue)
        ? existingHeaderValue[0]
        : existingHeaderValue;

    // Use existing ID or generate new one
    const requestId = existingId || randomUUID();

    // Attach to request
    req.requestId = requestId;

    // Add to response headers
    res.setHeader('X-Request-ID', requestId);

    next();
}

export default requestIdMiddleware;
