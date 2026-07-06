import { type Queue } from 'bullmq';
import { adQueue, notificationDeliveryQueue, notificationMatchQueue } from './adQueue';
import { imageOptimizationQueue } from './imageQueue';
import { paymentQueue } from './paymentQueue';
import schedulerQueue, { shouldDisableSchedulerQueue } from './schedulerQueue';
import { deadLetterQueue } from './deadLetterQueue';
import logger from '../utils/logger';
import { shouldDisableQueueConnection } from './redisConnection';
import { queueStatusGauge, reliabilityAlertsTotal } from '../infrastructure/telemetry/metrics';
import { emitReliabilityAlert } from '../infrastructure/telemetry/reliabilityAlerts';
import { env } from '../config/env';
import { recordQueueDelaySample } from '../infrastructure/telemetry/sloMonitor';

type QueueCounts = {
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
    completed: number;
};

export type QueueHealth = {
    name: string;
    status: 'up' | 'degraded' | 'down';
    counts: QueueCounts;
    queueDelayMs: number;
    oldestWaitingAgeMs: number;
    oldestDelayedAgeMs: number;
    error?: string;
};

const EMPTY_COUNTS: QueueCounts = {
    waiting: 0,
    active: 0,
    delayed: 0,
    failed: 0,
    completed: 0,
};

const hasGetJobCounts = <T>(queue: Queue<T> | null): queue is Queue<T> & {
    getJobCounts: (...types: Array<'waiting' | 'active' | 'delayed' | 'failed' | 'completed'>) => Promise<Record<string, number>>;
} => Boolean(queue && typeof (queue as Queue<T>).getJobCounts === 'function');

const hasGetJobs = <T>(queue: Queue<T> | null): queue is Queue<T> & {
    getJobs: (
        types?: Array<'waiting' | 'active' | 'completed' | 'failed' | 'delayed'>,
        start?: number,
        end?: number,
        asc?: boolean
    ) => Promise<Array<{ timestamp: number }>>;
} => Boolean(queue && typeof (queue as Queue<T>).getJobs === 'function');

const queueDelayThresholdMs = env.RELIABILITY_QUEUE_DELAY_THRESHOLD_MS ?? 60_000;

const readOldestJobAgeMs = async <T>(
    queue: Queue<T>,
    state: 'waiting' | 'delayed'
): Promise<number> => {
    if (!hasGetJobs(queue)) return 0;
    const jobs = await queue.getJobs([state], 0, 0, true);
    const oldest = jobs[0];
    if (!oldest?.timestamp) return 0;
    return Math.max(0, Date.now() - oldest.timestamp);
};

const readQueueHealth = async <T>(queueName: string, queue: Queue<T> | null): Promise<QueueHealth> => {
    if (!queue || !hasGetJobCounts(queue)) {
        queueStatusGauge.labels(queueName).set(0);
        return {
            name: queueName,
            status: 'down',
            counts: EMPTY_COUNTS,
            queueDelayMs: 0,
            oldestWaitingAgeMs: 0,
            oldestDelayedAgeMs: 0,
            error: 'queue unavailable in this runtime'
        };
    }

    try {
        const [counts, oldestWaitingAgeMs, oldestDelayedAgeMs] = await Promise.all([
            queue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed'),
            readOldestJobAgeMs(queue, 'waiting'),
            readOldestJobAgeMs(queue, 'delayed'),
        ]);

        const normalized: QueueCounts = {
            waiting: counts.waiting || 0,
            active: counts.active || 0,
            delayed: counts.delayed || 0,
            failed: counts.failed || 0,
            completed: counts.completed || 0,
        };

        const queueDelayMs = Math.max(oldestWaitingAgeMs, oldestDelayedAgeMs);

        return {
            name: queueName,
            status: normalized.failed > 0 || queueDelayMs > queueDelayThresholdMs ? 'degraded' : 'up',
            counts: normalized,
            queueDelayMs,
            oldestWaitingAgeMs,
            oldestDelayedAgeMs,
        };
    } catch (error) {
        logger.warn('[QUEUE_HEALTH] failed to read queue counts', {
            queueName,
            error: error instanceof Error ? error.message : String(error),
        });
        return {
            name: queueName,
            status: 'down',
            counts: EMPTY_COUNTS,
            queueDelayMs: 0,
            oldestWaitingAgeMs: 0,
            oldestDelayedAgeMs: 0,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

export const getQueueHealthProbe = async (): Promise<{
    enabled: boolean;
    status: 'up' | 'degraded' | 'down';
    queues: QueueHealth[];
}> => {
    const queueHealthChecks = await Promise.all([
        readQueueHealth('ad-events', adQueue),
        readQueueHealth('notification.delivery.queue', notificationDeliveryQueue),
        readQueueHealth('notification.match.queue', notificationMatchQueue),
        readQueueHealth('image-optimization-events', imageOptimizationQueue),
        readQueueHealth('payment-events', paymentQueue),
        readQueueHealth('scheduler-jobs', shouldDisableSchedulerQueue ? null : schedulerQueue),
        readQueueHealth('dead-letter-events', deadLetterQueue),
    ]);

    const enabled = !shouldDisableQueueConnection;

    // Fixed: Renamed variables to avoid 'any' keyword
    const hasDown = queueHealthChecks.some((entry) => entry.status === 'down');
    const hasDegraded = queueHealthChecks.some((entry) => entry.status === 'degraded');

    const status: 'up' | 'degraded' | 'down' =
        hasDown ? 'down' : hasDegraded ? 'degraded' : 'up';

    for (const entry of queueHealthChecks) {
        const gaugeValue = entry.status === 'up' ? 1 : entry.status === 'degraded' ? 0.5 : 0;
        queueStatusGauge.labels(entry.name).set(gaugeValue);
        recordQueueDelaySample(entry.name, entry.queueDelayMs);
    }

    if (status === 'down') {
        reliabilityAlertsTotal.labels('QUEUE_DOWN', 'critical').inc();
        void emitReliabilityAlert({
            type: 'QUEUE_DOWN',
            title: 'Queue subsystem down',
            severity: 'critical',
            summary: 'One or more queues are down',
            dedupeKey: 'queue_down',
            metadata: {
                queues: queueHealthChecks,
            },
        });
    }

    return {
        enabled,
        status,
        queues: queueHealthChecks,
    };
};