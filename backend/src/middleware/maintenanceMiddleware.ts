import { Request, Response, NextFunction } from 'express';
import { getSystemConfigDoc } from '../utils/systemConfigHelper';
import logger from '../utils/logger';
import { sendErrorResponse } from '../utils/errorResponse';

/**
 * 🛠️ Maintenance Middleware
 * 
 * Checks the singleton SystemConfig for maintenance mode status.
 * If enabled, blocks all traffic except for:
 * 1. Admin dashboard routes (/api/v1/admin)
 * 2. Health check (/api/v1/health)
 * 3. Specific Allowed IPs
 * 4. Requests with a valid bypass token
 */
export const maintenanceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const normalizeIp = (value: string) => value.replace(/^::ffff:/, '').trim();
        const requestPath = (req.originalUrl || req.url).split('?')[0] || '';

        // ALWAYS allow admin routes and health checks
        if (
            requestPath.startsWith('/api/v1/admin') ||
            requestPath === '/api/v1/health' ||
            requestPath === '/'
        ) {
            return next();
        }

        const config = await getSystemConfigDoc();

        // If no config, assume system is OK
        if (!config || !config.platform?.maintenance?.enabled) {
            return next();
        }

        const { maintenance } = config.platform;

        // Check Bypass Token (Header or Query)
        const bypassHeader = req.headers['x-maintenance-bypass'];
        const bypassQuery = req.query.bypass;
        if (maintenance.bypassToken && (bypassHeader === maintenance.bypassToken || bypassQuery === maintenance.bypassToken)) {
            return next();
        }

        // Check IP Whitelist
        const clientIp = normalizeIp(req.ip || req.socket.remoteAddress || '');
        const allowedIps = Array.isArray(maintenance.allowedIps)
            ? maintenance.allowedIps.map((value: unknown) => normalizeIp(String(value)))
            : [];
        if (allowedIps.includes(clientIp)) {
            return next();
        }

        // System is in maintenance mode
        const scheduledEnd = maintenance.scheduledEnd ? new Date(maintenance.scheduledEnd) : null;
        const retryAfter = scheduledEnd && !Number.isNaN(scheduledEnd.getTime())
            ? Math.max(0, Math.ceil((scheduledEnd.getTime() - Date.now()) / 1000))
            : 3600;
        res.set('Retry-After', String(retryAfter));
        sendErrorResponse(
            req,
            res,
            503,
            maintenance.message || 'System is currently under maintenance. Please try again later.',
            { code: 'MAINTENANCE_MODE', retryAfter }
        );

    } catch (error) {
        logger.error('[Maintenance Middleware] Error:', error);
        // Fail open to avoid blocking site if config fetch fails
        next();
    }
};
