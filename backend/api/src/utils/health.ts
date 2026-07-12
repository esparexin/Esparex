import { Request, Response } from 'express';
import { getHealthCheckData as coreGetHealthCheckData } from '@esparex/core/utils/health';
import { isDbReady } from '@esparex/core/config/db';
import logger from '@esparex/core/utils/logger';

export const getHealthCheckData = coreGetHealthCheckData;

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
                mongo: isDbReady() ? 'healthy' : 'failed',
                redis: 'failed',
                queue: 'failed',
                worker: 'failed'
            },
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
