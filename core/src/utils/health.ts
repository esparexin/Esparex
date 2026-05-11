import { Request, Response } from 'express';
import { getDatabaseHealthProbe, isDbReady } from '../config/db';
import { getQueueHealthProbe } from '../queues/queueHealth';
import type { QueueHealth } from '../queues/queueHealth';
import { getRedisHealthProbe, isConnected as redisConnected } from './redisCache';
import logger from './logger';
import { getWorkerStatusProbe } from './workerStatus';
import type { WorkerStatusEntry } from './workerStatus';

/**
 * Shared Health Check Logic
 * Provides a standardized response for system status and resource metrics.
 */
export const getHealthCheckData = async (deep = false) => {
    const mem = process.memoryUsage();

    const safeProbe = async <T>(fn: () => Promise<T>, fallback: T, timeoutMs = 2000): Promise<T> => {
        try {
            return await Promise.race([
                fn(),
                new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
            ]);
        } catch (err) {
            logger.error(`Health probe failed: ${err instanceof Error ? err.message : String(err)}`);
            return fallback;
        }
    };

    const redisHealth = await safeProbe(getRedisHealthProbe, { connected: false, pingOk: false, roundTripOk: false, latencyMs: 0 });
    const databaseHealth = await safeProbe(getDatabaseHealthProbe, {
        overall: 'down',
        user: {
            status: 'down',
            readyState: 0,
            stateLabel: 'not_initialized',
            pingOk: false,
            latencyMs: null
        },
        admin: {
            status: 'down',
            readyState: 0,
            stateLabel: 'not_initialized',
            pingOk: false,
            latencyMs: null
        }
    });

    let queueHealth;
    let workerHealth;

    if (deep) {
        queueHealth = await safeProbe(getQueueHealthProbe, { enabled: false, status: 'down' as const, queues: [] as QueueHealth[] });
        workerHealth = await safeProbe(getWorkerStatusProbe, { status: 'down' as const, workers: [] as WorkerStatusEntry[] });
    } else {
        queueHealth = {
            enabled: redisConnected,
            status: redisConnected ? 'up' as const : 'down' as const,
            queues: [] as QueueHealth[]
        };
        workerHealth = {
            status: redisConnected ? 'up' as const : 'down' as const,
            workers: [] as WorkerStatusEntry[]
        };
    }

    const isRedisOperational = Boolean(redisConnected && redisHealth && redisHealth.pingOk && redisHealth.roundTripOk);

    const overallStatus: 'ok' | 'degraded' | 'error' =
        databaseHealth.overall === 'up' && isRedisOperational && queueHealth.status === 'up'
            ? 'ok'
            : databaseHealth.overall === 'down' || !isRedisOperational
                ? 'error'
                : 'degraded';

    return {
        success: true,
        status: overallStatus,
        uptime: process.uptime(),
        memoryUsage: {
            heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`
        },
        services: {
            mongo: databaseHealth.overall === 'up' || isDbReady(),
            redis: isRedisOperational
        },
        redisConnected: isRedisOperational,
        redisPingLatencyMs: redisHealth?.latencyMs || 0,
        redisHealth,
        mongoConnected: isDbReady(),
        databaseHealth,
        queueStatus: queueHealth?.status || 'down',
        queueHealth,
        workerStatus: workerHealth?.status || 'down',
        workerHealth
    };
};

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
