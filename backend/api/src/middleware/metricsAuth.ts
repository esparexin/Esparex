import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/errorResponse';
import logger from '@esparex/core/utils/logger';

/**
 * 🛡️ METRICS ROUTE PROTECTION MIDDLEWARE
 * 
 * Guards Prometheus scraping and internal system summary routes against
 * unauthenticated external callers.
 * 
 * Authentication Strategy:
 * 1. Checks Header `x-metrics-token` or `Authorization: Bearer <token>` against `METRICS_AUTH_TOKEN`.
 * 2. In non-production (development/test), if `METRICS_AUTH_TOKEN` is unset, access is permitted.
 * 3. In production, if `METRICS_AUTH_TOKEN` is unset, access is denied (503 Service Unavailable).
 */
export const requireMetricsAuth = (req: Request, res: Response, next: NextFunction): void => {
    const metricsToken = process.env.METRICS_AUTH_TOKEN;
    const isProd = process.env.NODE_ENV === 'production';

    if (!metricsToken) {
        if (!isProd) {
            return next();
        }
        logger.warn(`[MetricsAuth] Unset METRICS_AUTH_TOKEN in production — rejecting telemetry access from ${req.ip}`);
        sendErrorResponse(req, res, 503, 'Metrics endpoint disabled: METRICS_AUTH_TOKEN not configured.');
        return;
    }

    const authHeader = req.headers.authorization;
    const headerToken = (req.headers['x-metrics-token'] as string) || 
        (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined);

    if (!headerToken || headerToken !== metricsToken) {
        logger.warn(`[MetricsAuth] Unauthorized telemetry access attempt from ${req.ip}`);
        sendErrorResponse(req, res, 401, 'Unauthorized metrics access.');
        return;
    }

    return next();
};
