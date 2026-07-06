import logger from '../utils/logger';
import { adWorker } from './adWorker';
import { notificationDeliveryWorker } from './notificationDeliveryWorker';
import { notificationMatchWorker } from './notificationMatchWorker';

import { paymentWorker } from './paymentWorker';
import { imageOptimizationWorker } from './imageWorker';
import mongoose from 'mongoose';
import redisClient from '../infrastructure/cache/redisCache';
import { gracefulShutdown } from '../infrastructure/process/shutdownHandler';
import { captureException } from '../infrastructure/telemetry/sentry';
import { env } from '../config/env';
import {
    queueJobDuration,
    queueJobFailuresTotal,
    queueJobsProcessedTotal,
    reliabilityAlertsTotal,
    workerStatusGauge,
} from '../infrastructure/telemetry/metrics';
import { emitReliabilityAlert } from '../infrastructure/telemetry/reliabilityAlerts';
import { getLocalWorkerStatuses, publishWorkerHeartbeat, setLocalWorkerStatus } from '../infrastructure/bullmq/workerStatus';
import { redisConnection, shouldDisableQueueConnection } from '../queues/redisConnection';

const QUEUE_FAILURE_WINDOW_MS = env.RELIABILITY_QUEUE_FAILURE_WINDOW_MS ?? 60_000;
const QUEUE_FAILURE_SPIKE_THRESHOLD = env.RELIABILITY_QUEUE_FAILURE_SPIKE_THRESHOLD ?? 20;
const WORKER_AUTO_RECOVERY_DELAY_MS = env.RELIABILITY_WORKER_AUTO_RECOVERY_DELAY_MS ?? 5_000;
const WORKER_AUTO_RECOVERY_MAX_ATTEMPTS = env.RELIABILITY_WORKER_AUTO_RECOVERY_MAX_ATTEMPTS ?? 3;
const queueFailureWindow = new Map<string, number[]>();
const activeJobStartTimes = new Map<string, number>();
const workerRecoveryAttempts = new Map<string, number>();
const workerRecoveryPending = new Set<string>();
const isRedisConnectivityIssue = (error: Error): boolean => {
    const candidate = `${error.name}:${error.message}`.toLowerCase();
    return candidate.includes('redis') ||
        candidate.includes('econnrefused') ||
        candidate.includes('econnreset') ||
        candidate.includes('etimedout');
};

const toJobMetricLabel = (jobName: string | undefined | null): string => {
    const candidate = typeof jobName === 'string' && jobName.trim().length > 0 ? jobName : 'unknown';
    return candidate.slice(0, 120);
};

const registerQueueFailureWindow = async (
    queueName: string,
    workerName: string
): Promise<void> => {
    const now = Date.now();
    const series = queueFailureWindow.get(queueName) || [];
    const nextSeries = series.filter((timestamp) => now - timestamp <= QUEUE_FAILURE_WINDOW_MS);
    nextSeries.push(now);
    queueFailureWindow.set(queueName, nextSeries);

    if (nextSeries.length >= QUEUE_FAILURE_SPIKE_THRESHOLD) {
        await emitReliabilityAlert({
            type: 'QUEUE_FAILURE_SPIKE',
            title: 'Queue failure spike detected',
            severity: 'critical',
            summary: `Queue ${queueName} crossed failure threshold`,
            dedupeKey: `queue_failure_spike:${queueName}`,
            metadata: {
                queueName,
                workerName,
                failuresInWindow: nextSeries.length,
                windowMs: QUEUE_FAILURE_WINDOW_MS,
                threshold: QUEUE_FAILURE_SPIKE_THRESHOLD,
            },
        });
    }
};

const registerWorkerDiagnostics = (
    workerName: string,
    queueName: string,
    worker: import('bullmq').Worker
) => {
    const recoveryKey = `${workerName}:${queueName}`;
    const resetRecoveryCounters = () => {
        workerRecoveryAttempts.set(recoveryKey, 0);
        workerRecoveryPending.delete(recoveryKey);
    };

    const scheduleWorkerAutoRecovery = async (
        reason: 'runtime_error' | 'redis_recovered',
        errorMessage?: string
    ): Promise<void> => {
        if (workerRecoveryPending.has(recoveryKey)) {
            return;
        }

        const attempts = workerRecoveryAttempts.get(recoveryKey) || 0;
        if (attempts >= WORKER_AUTO_RECOVERY_MAX_ATTEMPTS) {
            reliabilityAlertsTotal.labels('WORKER_AUTO_RECOVERY_EXHAUSTED', 'critical').inc();
            await emitReliabilityAlert({
                type: 'WORKER_AUTO_RECOVERY_EXHAUSTED',
                title: 'Worker auto-recovery exhausted',
                severity: 'critical',
                summary: `Worker ${workerName} exceeded auto-recovery attempts`,
                dedupeKey: `worker_recovery_exhausted:${workerName}:${queueName}`,
                service: 'worker-runtime',
                module: 'worker-recovery',
                metadata: {
                    workerName,
                    queueName,
                    attempts,
                    maxAttempts: WORKER_AUTO_RECOVERY_MAX_ATTEMPTS,
                    reason,
                    error: errorMessage,
                },
            });
            if (env.PROCESS_ROLE === 'worker') {
                logger.error(`[${workerName}] Triggering process restart after recovery exhaustion`, { queueName, attempts });
                setTimeout(() => process.exit(1), 2_000).unref();
            }
            return;
        }

        workerRecoveryPending.add(recoveryKey);
        workerRecoveryAttempts.set(recoveryKey, attempts + 1);
        setLocalWorkerStatus(workerName, 'degraded', {
            queueName,
            reason: 'auto_recovery_scheduled',
            attempts: attempts + 1,
            trigger: reason,
        });
        workerStatusGauge.labels(workerName).set(0);
        void publishWorkerHeartbeat(workerName, 'degraded', {
            queueName,
            reason: 'auto_recovery_scheduled',
            attempts: attempts + 1,
            trigger: reason,
        });

        setTimeout(() => {
            void (async () => {
                try {
                    logger.warn(`[${workerName}] Starting worker auto-recovery attempt`, {
                        queueName,
                        attempt: attempts + 1,
                        reason,
                    });
                    await worker.pause(true);
                    await worker.resume();
                    resetRecoveryCounters();
                    setLocalWorkerStatus(workerName, 'up', {
                        queueName,
                        reason: 'auto_recovered',
                        attempts: attempts + 1,
                    });
                    workerStatusGauge.labels(workerName).set(1);
                    await publishWorkerHeartbeat(workerName, 'up', {
                        queueName,
                        reason: 'auto_recovered',
                        attempts: attempts + 1,
                    });
                    reliabilityAlertsTotal.labels('WORKER_AUTO_RECOVERED', 'info').inc();
                    await emitReliabilityAlert({
                        type: 'WORKER_AUTO_RECOVERED',
                        title: 'Worker auto-recovered',
                        severity: 'info',
                        summary: `Worker ${workerName} resumed successfully`,
                        dedupeKey: `worker_auto_recovered:${workerName}:${queueName}`,
                        service: 'worker-runtime',
                        module: 'worker-recovery',
                        metadata: {
                            workerName,
                            queueName,
                            attempt: attempts + 1,
                            trigger: reason,
                        },
                    });
                } catch (recoveryError) {
                    workerRecoveryPending.delete(recoveryKey);
                    logger.error(`[${workerName}] Worker auto-recovery failed`, {
                        queueName,
                        attempt: attempts + 1,
                        error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
                    });
                    void scheduleWorkerAutoRecovery(
                        reason,
                        recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
                    );
                }
            })();
        }, WORKER_AUTO_RECOVERY_DELAY_MS).unref();
    };

    setLocalWorkerStatus(workerName, 'starting', { queueName });
    workerStatusGauge.labels(workerName).set(0);
    void publishWorkerHeartbeat(workerName, 'starting', { queueName });

    worker.on('ready', () => {
        resetRecoveryCounters();
        setLocalWorkerStatus(workerName, 'up', { queueName });
        workerStatusGauge.labels(workerName).set(1);
        void publishWorkerHeartbeat(workerName, 'up', { queueName });
    });

    worker.on('active', (job) => {
        if (!job) return;
        activeJobStartTimes.set(`${queueName}:${String(job.id)}`, Date.now());
    });

    worker.on('completed', (job) => {
        const jobLabel = toJobMetricLabel(job?.name);
        if (job) {
            const key = `${queueName}:${String(job.id)}`;
            const startedAt = activeJobStartTimes.get(key);
            if (startedAt) {
                queueJobDuration.labels(queueName, jobLabel, 'completed').observe((Date.now() - startedAt) / 1000);
                activeJobStartTimes.delete(key);
            }
        }
        queueJobsProcessedTotal.labels(queueName, jobLabel, 'completed').inc();
        resetRecoveryCounters();
        setLocalWorkerStatus(workerName, 'up', { queueName });
        workerStatusGauge.labels(workerName).set(1);
        void publishWorkerHeartbeat(workerName, 'up', { queueName });
    });

    worker.on('stalled', (jobId) => {
        logger.warn(`[${workerName}] Job stalled`, { queueName, jobId });
        queueJobFailuresTotal.labels(queueName, 'unknown', 'stalled').inc();
        setLocalWorkerStatus(workerName, 'degraded', { queueName, reason: 'stalled' });
        workerStatusGauge.labels(workerName).set(0);
        void publishWorkerHeartbeat(workerName, 'degraded', { queueName, reason: 'stalled', jobId });
    });

    worker.on('closed', () => {
        logger.error(`[${workerName}] Worker closed unexpectedly`, { queueName });
        setLocalWorkerStatus(workerName, 'down', { queueName, reason: 'closed' });
        workerStatusGauge.labels(workerName).set(0);
        void publishWorkerHeartbeat(workerName, 'down', { queueName, reason: 'closed' });
        void scheduleWorkerAutoRecovery('runtime_error', 'worker_closed');
    });

    worker.on('failed', (job, error) => {
        const jobLabel = toJobMetricLabel(job?.name);
        if (job) {
            const key = `${queueName}:${String(job.id)}`;
            const startedAt = activeJobStartTimes.get(key);
            if (startedAt) {
                queueJobDuration.labels(queueName, jobLabel, 'failed').observe((Date.now() - startedAt) / 1000);
                activeJobStartTimes.delete(key);
            }
        }
        queueJobsProcessedTotal.labels(queueName, jobLabel, 'failed').inc();
        queueJobFailuresTotal.labels(queueName, jobLabel, 'failed').inc();

        const err = error instanceof Error ? error : new Error(String(error));
        captureException(err, {
            workerName,
            queueName,
            jobId: job?.id ? String(job.id) : 'unknown',
            jobName: jobLabel,
            attemptsMade: job?.attemptsMade,
        });
        void registerQueueFailureWindow(queueName, workerName);

        setLocalWorkerStatus(workerName, 'degraded', {
            queueName,
            reason: 'job_failed',
            jobName: jobLabel,
            jobId: job?.id ? String(job.id) : undefined,
        });
        workerStatusGauge.labels(workerName).set(0);
        void publishWorkerHeartbeat(workerName, 'degraded', {
            queueName,
            reason: 'job_failed',
            jobName: jobLabel,
            jobId: job?.id ? String(job.id) : undefined,
        });
    });

    worker.on('error', (error) => {
        logger.error(`[${workerName}] Worker error`, { queueName, error: error.message });
        queueJobFailuresTotal.labels(queueName, 'unknown', 'runtime_error').inc();
        captureException(error, {
            workerName,
            queueName,
            phase: 'runtime_error',
        });
        void registerQueueFailureWindow(queueName, workerName);
        setLocalWorkerStatus(workerName, 'down', { queueName, reason: 'runtime_error', error: error.message });
        workerStatusGauge.labels(workerName).set(0);
        void publishWorkerHeartbeat(workerName, 'down', {
            queueName,
            reason: 'runtime_error',
            error: error.message,
        });

        if (isRedisConnectivityIssue(error)) {
            logger.warn(`[${workerName}] Pausing worker due to Redis connectivity issue`, { queueName });
            void worker.pause(true).catch((pauseError) => {
                logger.error(`[${workerName}] Failed to pause worker`, {
                    queueName,
                    error: pauseError instanceof Error ? pauseError.message : String(pauseError),
                });
            });
            void scheduleWorkerAutoRecovery('redis_recovered', error.message);
            return;
        }
        void scheduleWorkerAutoRecovery('runtime_error', error.message);
    });
};

export const startWorkers = () => {
    logger.info('Starting background workers...');

    registerWorkerDiagnostics('AdWorker', 'ad-events', adWorker as unknown as import('bullmq').Worker);
    registerWorkerDiagnostics('NotificationDeliveryWorker', 'notification.delivery.queue', notificationDeliveryWorker as unknown as import('bullmq').Worker);
    registerWorkerDiagnostics('NotificationMatchWorker', 'notification.match.queue', notificationMatchWorker as unknown as import('bullmq').Worker);
    registerWorkerDiagnostics('PaymentWorker', 'payment-events', paymentWorker as unknown as import('bullmq').Worker);
    registerWorkerDiagnostics('ImageOptimizationWorker', 'image-optimization-events', imageOptimizationWorker as unknown as import('bullmq').Worker);

    const workers: Array<{ name: string; queueName: string; worker: import('bullmq').Worker }> = [
        { name: 'AdWorker', queueName: 'ad-events', worker: adWorker as unknown as import('bullmq').Worker },
        { name: 'NotificationDeliveryWorker', queueName: 'notification.delivery.queue', worker: notificationDeliveryWorker as unknown as import('bullmq').Worker },
        { name: 'NotificationMatchWorker', queueName: 'notification.match.queue', worker: notificationMatchWorker as unknown as import('bullmq').Worker },
        { name: 'PaymentWorker', queueName: 'payment-events', worker: paymentWorker as unknown as import('bullmq').Worker },
        { name: 'ImageOptimizationWorker', queueName: 'image-optimization-events', worker: imageOptimizationWorker as unknown as import('bullmq').Worker },
    ];

    adWorker.on('ready', () => {
        logger.info("AdWorker is fully running and listening to 'ad-events' queue.");
    });

    notificationDeliveryWorker.on('ready', () => {
        logger.info("NotificationDeliveryWorker is fully running and listening to 'notification.delivery.queue' queue.");
    });

    paymentWorker.on('ready', () => {
        logger.info("PaymentWorker is fully running and listening to 'payment-events' queue.");
    });
    notificationMatchWorker.on('ready', () => {
        logger.info("NotificationMatchWorker is fully running and listening to 'notification.match.queue'.");
    });
    
    imageOptimizationWorker.on('ready', () => {
        logger.info("ImageOptimizationWorker is fully running and listening to 'image-optimization-events'.");
    });

    if (!shouldDisableQueueConnection && typeof (redisConnection as unknown as { on?: (event: string, listener: (...args: unknown[]) => void) => void }).on === 'function') {
        redisConnection.on('ready', () => {
            for (const entry of workers) {
                void (async () => {
                    try {
                        await Promise.resolve(entry.worker.resume());
                        setLocalWorkerStatus(entry.name, 'up', {
                            queueName: entry.queueName,
                            reason: 'redis_recovered',
                        });
                        workerStatusGauge.labels(entry.name).set(1);
                        await publishWorkerHeartbeat(entry.name, 'up', {
                            queueName: entry.queueName,
                            reason: 'redis_recovered',
                        });
                    } catch (error: unknown) {
                        logger.warn(`[${entry.name}] Failed to resume after Redis ready`, {
                            queueName: entry.queueName,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                })();
            }
        });
    }

    const workerHeartbeatInterval = setInterval(() => {
        const heartbeats = getLocalWorkerStatuses().map((entry) =>
            publishWorkerHeartbeat(entry.name, entry.status, entry.details)
        );
        void Promise.allSettled(heartbeats);
    }, 15_000);
    workerHeartbeatInterval.unref();

    const handleShutdown = async () => {
        clearInterval(workerHeartbeatInterval);
        await gracefulShutdown({
            workers: workers.map((entry) => entry.worker),
            redisClient,
            mongooseConnection: mongoose.connection
        });
    };

    process.on('SIGTERM', () => void handleShutdown());
    process.on('SIGINT', () => void handleShutdown());
};
