import { Request, Response } from 'express';
import { isDbReady } from '../config/db';
import { getRedisHealthProbe, isConnected as redisConnected } from '../utils/redisCache';

/**
 * Shared Health Check Logic
 * Provides a standardized response for system status and resource metrics.
 */
export const getHealthCheckData = async () => {
    const mem = process.memoryUsage();
    const redisHealth = await getRedisHealthProbe();
    
    return {
        success: true,
        status: 'ok',
        uptime: process.uptime(),
        memoryUsage: {
            heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`
        },
        redisConnected: redisConnected && redisHealth.pingOk && redisHealth.roundTripOk,
        redisPingLatencyMs: redisHealth.latencyMs,
        redisHealth,
        mongoConnected: isDbReady(),
        queueStatus: 'running'
    };
};

export const healthCheckHandler = async (_req: Request, res: Response) => {
    try {
        const healthData = await getHealthCheckData();
        res.status(200).json(healthData);
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
