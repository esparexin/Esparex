import { Request, Response } from 'express';
import { getHealthCheckData as coreGetHealthCheckData } from '@esparex/core/utils/health';
import { isDbReady } from '@esparex/core/config/db';
import logger from '@esparex/core/utils/logger';
import { otpHealthCheck } from '../middleware/otpGuard';

export const getHealthCheckData = coreGetHealthCheckData;

export const healthCheckHandler = async (req: Request, res: Response) => {
    try {
        if (process.env.NODE_ENV === 'development') {
            logger.info(`[Health] Ping from ${req.ip}`);
        }
        const deep = req.query.deep === 'true';
        const healthData = await getHealthCheckData(deep);
        const statusCode = healthData.status === 'error' ? 503 : 200;
        const success = healthData.status !== 'error';
        // OTP readiness is informational only (liveness unchanged): it reports
        // guard status booleans so monitors can alert on dead login without
        // exposing keys, OTPs, or provider credentials. Added after the Oct 2026
        // send-otp incident stayed green on /health for ~150h.
        return res.status(statusCode).json({ ...healthData, success, otp: otpHealthCheck() });
    } catch (error) {
        return res.status(503).json({
            success: false,
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
