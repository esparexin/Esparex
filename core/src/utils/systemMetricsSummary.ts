import { getHealthCheckData } from './health';
import { getSloSnapshot } from './sloMonitor';
import { getSecurityMonitoringSnapshot } from './securityMonitoring';
import { getCircuitBreakerSnapshot } from './resilience';

export const getSystemMetricsSummary = async (): Promise<{
    timestamp: string;
    api: {
        status: 'ok' | 'degraded' | 'error';
        success: boolean;
        uptimeSeconds: number;
        slo: ReturnType<typeof getSloSnapshot>;
    };
    queue: {
        status: 'up' | 'degraded' | 'down';
        totals: {
            waiting: number;
            active: number;
            delayed: number;
            failed: number;
            completed: number;
        };
        backlog: {
            totalBacklog: number;
            highestQueueDelayMs: number;
            delayedJobs: number;
        };
        failureRate: number;
        queues: Array<{
            name: string;
            status: 'up' | 'degraded' | 'down';
            counts: {
                waiting: number;
                active: number;
                delayed: number;
                failed: number;
                completed: number;
            };
            queueDelayMs: number;
            oldestWaitingAgeMs: number;
            oldestDelayedAgeMs: number;
            error?: string;
        }>;
    };
    worker: {
        status: 'up' | 'degraded' | 'down';
        total: number;
        up: number;
        degraded: number;
        down: number;
        workers: Array<{
            name: string;
            status: 'starting' | 'up' | 'degraded' | 'down';
            lastSeen: string | null;
            details?: Record<string, unknown>;
        }>;
    };
    dependency: {
        database: {
            status: 'up' | 'degraded' | 'down';
            userLatencyMs: number | null;
            adminLatencyMs: number | null;
        };
        redis: {
            status: 'up' | 'down';
            latencyMs: number | null;
        };
    };
    failureRates: {
        apiErrorRateRatio: number | null;
        queueFailureRateRatio: number;
    };
    security: ReturnType<typeof getSecurityMonitoringSnapshot>;
    circuitBreakers: ReturnType<typeof getCircuitBreakerSnapshot>;
}> => {
    const health = await getHealthCheckData();
    const sloSnapshot = getSloSnapshot();
    const securitySnapshot = getSecurityMonitoringSnapshot();
    const circuitBreakers = getCircuitBreakerSnapshot();

    const queueTotals = health.queueHealth.queues.reduce((acc, entry) => {
        acc.waiting += entry.counts.waiting;
        acc.active += entry.counts.active;
        acc.delayed += entry.counts.delayed;
        acc.failed += entry.counts.failed;
        acc.completed += entry.counts.completed;
        return acc;
    }, {
        waiting: 0,
        active: 0,
        delayed: 0,
        failed: 0,
        completed: 0,
    });

    const highestQueueDelayMs = health.queueHealth.queues.reduce((max, entry) =>
        Math.max(max, entry.queueDelayMs || 0), 0);

    const totalQueueProcessed = queueTotals.completed + queueTotals.failed;
    const queueFailureRate = totalQueueProcessed > 0
        ? queueTotals.failed / totalQueueProcessed
        : 0;

    const workers = health.workerHealth.workers;
    const up = workers.filter((worker) => worker.status === 'up').length;
    const degraded = workers.filter((worker) => worker.status === 'degraded' || worker.status === 'starting').length;
    const down = workers.filter((worker) => worker.status === 'down').length;

    return {
        timestamp: new Date().toISOString(),
        api: {
            status: health.status,
            success: health.success,
            uptimeSeconds: health.uptime,
            slo: sloSnapshot,
        },
        queue: {
            status: health.queueStatus,
            totals: queueTotals,
            backlog: {
                totalBacklog: queueTotals.waiting + queueTotals.active + queueTotals.delayed,
                highestQueueDelayMs,
                delayedJobs: queueTotals.delayed,
            },
            failureRate: queueFailureRate,
            queues: health.queueHealth.queues,
        },
        worker: {
            status: health.workerStatus,
            total: workers.length,
            up,
            degraded,
            down,
            workers,
        },
        dependency: {
            database: {
                status: health.databaseHealth.overall,
                userLatencyMs: health.databaseHealth.user.latencyMs,
                adminLatencyMs: health.databaseHealth.admin.latencyMs,
            },
            redis: {
                status: health.redisConnected ? 'up' : 'down',
                latencyMs: health.redisPingLatencyMs,
            },
        },
        failureRates: {
            apiErrorRateRatio: sloSnapshot.state.apiErrorRate.latestValue,
            queueFailureRateRatio: queueFailureRate,
        },
        security: securitySnapshot,
        circuitBreakers,
    };
};

