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
