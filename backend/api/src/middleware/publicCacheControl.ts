import type { Request, Response, NextFunction } from 'express';

/**
 * Cache-Control middleware for static public catalog and location GET endpoints.
 * Sets max-age=300 (5 mins) and stale-while-revalidate=3600 (1 hour).
 */
export const publicCacheControl = (maxAgeSeconds = 300, staleWhileRevalidateSeconds = 3600) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.method === 'GET') {
            res.setHeader(
                'Cache-Control',
                `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`
            );
        }
        next();
    };
};
