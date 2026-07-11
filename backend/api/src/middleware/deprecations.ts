import type { Express, Request, Response, RequestHandler } from 'express';
import logger from '@esparex/core/utils/logger';

/**
 * ESPAREX API DEPRECATION MODULE
 * 
 * This module centralizes all legacy routes that have been moved, replaced,
 * or retired. It ensures consistent 410 Gone and 308 Permanent Redirect 
 * responses with standardized headers.
 */

const DEFAULT_SUNSET_DATE = 'Wed, 31 Dec 2026 23:59:59 GMT';

interface DeprecationOptions {
    successor: string;
    sunsetAt?: string;
    message?: string;
}

/**
 * Returns a standardized 410 Gone response
 */
const handleGone = (options: DeprecationOptions): RequestHandler => {
    return (req: Request, res: Response) => {
        const sunsetAt = options.sunsetAt || DEFAULT_SUNSET_DATE;
        const message = options.message || `This endpoint is deprecated. Use ${options.successor} instead.`;

        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', sunsetAt);
        res.setHeader('Link', `<${options.successor}>; rel="successor-version"`);
        res.setHeader('X-Deprecated-Endpoint', 'true');

        logger.warn(`[DEPRECATION] 410 Gone accessed: ${req.originalUrl}`, {
            method: req.method,
            path: req.originalUrl,
            successor: options.successor,
            sunsetAt
        });

        res.status(410).json({
            success: false,
            error: message,
            code: 'ENDPOINT_DEPRECATED',
            deprecated: true,
            path: req.originalUrl,
            replacement: options.successor,
            sunsetAt,
            status: 410
        });
    };
};

/**
 * Returns a standardized 308 Permanent Redirect with deprecation headers
 */
const handleRedirect = (fromPrefix: string, toPrefix: string, options: Partial<DeprecationOptions> = {}): RequestHandler => {
    return (req: Request, res: Response) => {
        const originalPath = req.originalUrl || req.url || fromPrefix;
        const successorPath = originalPath.replace(new RegExp(`^${fromPrefix}(?=/|$)`), toPrefix);
        const sunsetAt = options.sunsetAt || DEFAULT_SUNSET_DATE;

        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', sunsetAt);
        res.setHeader('Link', `<${successorPath}>; rel="successor-version"`);
        res.setHeader('X-Deprecated-Endpoint', 'true');

        logger.warn(`[DEPRECATION] 308 Redirected: ${req.originalUrl} -> ${successorPath}`, {
            method: req.method,
            originalUrl: req.originalUrl,
            successorPath,
            fromPrefix,
            toPrefix
        });

        res.redirect(308, successorPath);
    };
};

/**
 * Warns that a specific HTTP method for this route is deprecated.
 * Passes the request to the next handler but attaches deprecation headers.
 */
export const deprecateMethod = (successorMethod: string, options: Partial<DeprecationOptions> = {}): RequestHandler => {
    return (req: Request, res: Response, next: import('express').NextFunction) => {
        const sunsetAt = options.sunsetAt || DEFAULT_SUNSET_DATE;
        
        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', sunsetAt);
        res.setHeader('X-Deprecated-Method', req.method);
        res.setHeader('X-Successor-Method', successorMethod.toUpperCase());

        logger.warn(`[DEPRECATION] Deprecated method used: ${req.method} ${req.originalUrl}`, {
            method: req.method,
            path: req.originalUrl,
            successorMethod
        });

        next();
    };
};

/**
 * Registers all deprecated and legacy routes
 */
export const registerDeprecationRoutes = (app: Express): void => {
    logger.info('Registering API deprecation layer...');

    // 1. Permanent Redirects (308)
    // Legacy Admin API
    app.use('/api/admin', handleRedirect('/api/admin', '/api/v1/admin'));
    
    // Legacy Contact API
    app.use('/api/v1/contact', handleRedirect('/api/v1/contact', '/api/v1/contacts'));

    // 2. Gone Endpoints (410)
    // Legacy Ads (Replaced by Unified Listings)
    const listingSuccessor = { 
        successor: '/api/v1/listings',
        message: 'This endpoint is deprecated. Use the unified /api/v1/listings instead.'
    };
    
    app.use('/api/v1/ads', handleGone(listingSuccessor));
    app.use('/api/v1/services', handleGone(listingSuccessor));
    app.use('/api/v1/spare-part-listings', handleGone(listingSuccessor));

    logger.info('API deprecation layer successfully registered.');
};
