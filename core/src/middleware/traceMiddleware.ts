import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { TraceContext } from '@shared/observability/trace';

/**
 * Global Trace Middleware
 * 
 * 1. Captures existing x-correlation-id or generates a new one.
 * 2. Sets the AsyncLocalStorage context via TraceContext.
 * 3. Injects traceId into req.traceId for logging.
 * 4. Ensures response headers contain X-Trace-ID for end-to-end observability.
 */
export const traceMiddleware = (serviceName: string) => (req: any, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-correlation-id'] as string) || 
                  (req.headers['x-trace-id'] as string) || 
                  (req.headers['x-request-id'] as string) || 
                  randomUUID();

    // Bind to Async Context
    TraceContext.setCorrelationId(traceId);

    // Attach to Request object
    req.traceId = traceId;
    req.serviceName = serviceName;

    // Attach to Response Headers
    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Correlation-ID', traceId);

    next();
};

export default traceMiddleware;
