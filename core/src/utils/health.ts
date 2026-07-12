import { env } from '../config/env';
import { getDatabaseHealthProbe, isDbReady } from '../config/db';
import { getQueueHealthProbe } from '../queues/queueHealth';
import type { QueueHealth } from '../queues/queueHealth';
import { getRedisHealthProbe, isConnected as redisConnected } from './redisCache';
import { getRedisOperationalObservabilityReport } from '../config/redisFactory';
import logger from './logger';
import { getWorkerStatusProbe } from './workerStatus';
import type { WorkerStatusEntry } from './workerStatus';

export type SubsystemState = 'healthy' | 'degraded' | 'disabled' | 'skipped' | 'failed';

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
        user: { status: 'down', readyState: 0, stateLabel: 'not_initialized', pingOk: false, latencyMs: null },
        admin: { status: 'down', readyState: 0, stateLabel: 'not_initialized', pingOk: false, latencyMs: null }
    });
    let queueHealth;
    let workerHealth;

    if (deep) {
        queueHealth = await safeProbe(getQueueHealthProbe, { enabled: false, status: 'down' as const, queues: [] as QueueHealth[] });
        workerHealth = await safeProbe(getWorkerStatusProbe, { status: 'down' as const, workers: [] as WorkerStatusEntry[] });
    } else {
        queueHealth = { enabled: redisConnected, status: redisConnected ? 'up' as const : 'down' as const, queues: [] as QueueHealth[] };
        workerHealth = { status: redisConnected ? 'up' as const : 'down' as const, workers: [] as WorkerStatusEntry[] };
    }

    const isRedisOperational = Boolean(redisConnected && redisHealth && redisHealth.pingOk && redisHealth.roundTripOk);
    const redisOperationalReport = getRedisOperationalObservabilityReport();
    const dbOperational = databaseHealth.overall === 'up';

    // Subsystem Expectations & States
    const redisState: SubsystemState = !env.ALLOW_REDIS ? 'disabled' : (isRedisOperational ? 'healthy' : 'failed');
    
    let queueState: SubsystemState = 'skipped';
    if (redisState === 'healthy' || (redisState as SubsystemState) === 'degraded') {
        queueState = !env.ALLOW_SCHEDULER_QUEUE ? 'disabled' : (queueHealth.status === 'up' ? 'healthy' : 'failed');
    }

    let workerState: SubsystemState = 'skipped';
    if (queueState === 'healthy' || (queueState as SubsystemState) === 'degraded') {
        workerState = !env.RUN_SCHEDULERS ? 'disabled' : (workerHealth.status === 'up' ? 'healthy' : 'failed');
    }

    const dbState: SubsystemState = dbOperational ? 'healthy' : 'failed';

    const subsystems: SubsystemState[] = [redisState, queueState, workerState, dbState];
    const hasFailed = subsystems.includes('failed');
    const hasDegraded = subsystems.includes('degraded');

    // Runtime Health answers: Can this process safely serve requests?
    // It's only 'error' if an EXPECTED subsystem has 'failed'.
    const overallStatus: 'ok' | 'degraded' | 'error' = hasFailed ? 'error' : (hasDegraded ? 'degraded' : 'ok');

    return {
        success: true,
        status: overallStatus,
        uptime: process.uptime(),
        memoryUsage: {
            heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`
        },
        services: {
            mongo: dbState,
            redis: redisState,
            queue: queueState,
            worker: workerState
        },
        redisConnected: isRedisOperational,
        cacheBackend: redisOperationalReport.cacheBackend,
        queueBackend: redisOperationalReport.queueBackend,
        pubSubBackend: redisOperationalReport.pubSubBackend,
        reconnects: redisOperationalReport.reconnects,
        fallbackState: redisOperationalReport.fallbackState,
        runtimeWarnings: redisOperationalReport.runtimeWarnings,
        timestamp: redisOperationalReport.timestamp,
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
