import { Request, Response } from 'express';
import { getDatabaseHealthProbe, isDbReady } from '../config/db';
import { getQueueHealthProbe } from '../queues/queueHealth';
import { getRedisHealthProbe, isConnected as redisConnected } from './redisCache';
import logger from './logger';
import { getWorkerStatusProbe } from './workerStatus';

/**
 * Shared Health Check Logic
 * Provides a standardized response for system status and resource metrics.
 */
export const getHealthCheckData = async () => {
    const mem = process.memoryUsage();
    const redisHealth = await getRedisHealthProbe();
    const databaseHealth = await getDatabaseHealthProbe();
    const queueHealth = await getQueueHealthProbe();
    const workerHealth = await getWorkerStatusProbe();
    const isRedisOperational = redisConnected && redisHealth.pingOk && redisHealth.roundTripOk;

    const overallStatus: 'ok' | 'degraded' | 'error' =
        databaseHealth.overall === 'up' && isRedisOperational && queueHealth.status === 'up'
            ? 'ok'
            : databaseHealth.overall === 'down' || !isRedisOperational
                ? 'error'
                : 'degraded';
    
    return {
        success: overallStatus !== 'error',
        status: overallStatus,
        uptime: process.uptime(),
        memoryUsage: {
            heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`
        },
        redisConnected: isRedisOperational,
        redisPingLatencyMs: redisHealth.latencyMs,
        redisHealth,
        mongoConnected: isDbReady(),
        databaseHealth,
        queueStatus: queueHealth.status,
        queueHealth,
        workerStatus: workerHealth.status,
        workerHealth
    };
};

export const healthCheckHandler = async (req: Request, res: Response) => {
    try {
        // Log health checks in dev for visibility
        if (process.env.NODE_ENV === 'development') {
            logger.info(`[Health] Ping from ${req.ip}`);
        }
        const healthData = await getHealthCheckData();
        const statusCode = healthData.status === 'error' ? 503 : 200;
        res.status(statusCode).json(healthData);
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
