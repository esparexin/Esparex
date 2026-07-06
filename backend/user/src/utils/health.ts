/**
 * ESPAREX â€” HEALTH CHECK HANDLER (backend/user transport layer)
 *
 * Contains the Express-aware healthCheckHandler route function.
 * The pure getHealthCheckData() data collector remains in @utils/health.
 */
export { getHealthCheckData } from '@esparex/core/tooling';;

import { Request, Response } from 'express';
import { logger } from '@esparex/core/utils';;;;
import { getHealthCheckData } from '@esparex/core/tooling';;
import { isDbReady } from '@esparex/core/infrastructure';;

export const healthCheckHandler = async (req: Request, res: Response) => {
    try {
        if (process.env.NODE_ENV === 'development') {
            logger.info(`[Health] Ping from ${req.ip}`);
        }
        const deep = req.query.deep === 'true';
        const healthData = await getHealthCheckData(deep);
        return res.status(200).json(healthData);
    } catch (error) {
        return res.status(200).json({
            success: true,
            status: 'error',
            services: {
                mongo: isDbReady(),
                redis: false
            },
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

