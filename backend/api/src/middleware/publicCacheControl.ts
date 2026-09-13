import { Request, Response, NextFunction } from 'express';

/**
 * Middleware setting Cache-Control headers for static/public GET requests.
 * @param maxAgeSeconds Max-age in seconds for client/CDN browser cache (default: 300s = 5m)
 * @param staleWhileRevalidateSeconds Stale-while-revalidate window (default: 3600s = 1h)
 */
export const publicCacheControl = (
    maxAgeSeconds = 300,
    staleWhileRevalidateSeconds = 3600
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`);
        }
        next();
    };
};

/**
 * Middleware setting strict no-cache/no-store headers for user-sensitive dynamic GET endpoints.
 * Prevents CDN, reverse proxy, and browser caching of user IP / identity data.
 */
export const privateNoCacheControl = () => {
    return (_req: Request, res: Response, next: NextFunction): void => {
        res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
    };
};

