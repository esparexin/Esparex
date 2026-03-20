import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import logger from '../utils/logger';

export const duplicateCooldownMiddleware = (listingType: 'ad' | 'spare_part' | 'service' = 'ad') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const sellerId = (req as any).user?.id || (req as any).user?._id;
            
            // If no auth, skip the check (auth middleware will catch it later if required)
            if (!sellerId) {
                return next();
            }



            const key = `cooldown:submission:${sellerId}:${listingType}`;
            const TTL_SECONDS = 10;

            const result = await redis.set(key, '1', 'EX', TTL_SECONDS, 'NX');

            if (!result) {
                logger.warn('Duplicate submission cooldown hit', { sellerId, listingType });
                res.status(429).json({
                    success: false,
                    message: `Please wait a few seconds before posting another ${listingType.replace('_', ' ')}.`
                });
                return;
            }

            // Attach a cleanup function to response finish event (if it fails, we release the block)
            res.on('finish', () => {
                // Technically if it's successful we can keep the 10s block to prevent exact double-click dups,
                // but if the status code indicates a 5xx server error, we should probably delete the key
                // so the user can retry immediately.
                if (res.statusCode >= 500) {
                    redis.del(key).catch((err: any) => logger.error('Failed to cleanup cooldown key on 5xx', { error: err.message, key }));
                }
            });

            next();
        } catch (error) {
            logger.error('Error in duplicateCooldownMiddleware', { error: error instanceof Error ? error.message : String(error) });
            // Fail open: don't block submission if redis throws
            next();
        }
    };
};
