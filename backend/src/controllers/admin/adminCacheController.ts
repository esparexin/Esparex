import { Request, Response } from 'express';
import { AdminCacheService } from '../../services/admin/AdminCacheService';
import { sendAdminError } from './adminBaseController';
import { respond } from '../../utils/respond';

/**
 * GET /api/v1/admin/cache/stats
 * Fetch real-time Redis performance and health metrics
 */
export const getStats = async (req: Request, res: Response) => {
    try {
        const stats = await AdminCacheService.getStats();
        res.json(respond({
            success: true,
            data: stats
        }));
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

/**
 * POST /api/v1/admin/cache/invalidate
 * Trigger manual invalidation by pattern
 */
export const invalidate = async (req: Request, res: Response) => {
    try {
        const { pattern } = req.body;
        const result = await AdminCacheService.invalidatePattern(pattern);
        
        res.json(respond({
            success: true,
            data: result,
            message: `Cache invalidated for pattern: ${pattern}`
        }));
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};
