import { Worker } from 'bullmq';
import { redisConnection, shouldDisableQueueConnection } from '../queues/redisConnection';
import { processAdForAlerts } from '../services/SmartAlertService';
import { enqueueSavedSearchAlertDispatch, processSavedSearchAlertDispatch } from '../services/SavedSearchService';
import logger from '../utils/logger';
import { enqueueDeadLetter } from '../queues/deadLetterQueue';
import { queueWorkerBackoffStrategy } from '../queues/queueDefaults';
import { TraceContext } from '@esparex/shared';
import { clearReliabilityContext, setReliabilityContext } from '../utils/reliabilityContext';

/**
 * Notification Match Worker
 * Domain: notification
 * Queue:  notification.match.queue
 *
 * Responsibilities:
 *  1. Process Smart Alert fan-out for newly activated ads (job: process_smart_alerts)
 *  2. Dispatch Saved Search alert emails/pushes           (job: alertDispatchJob)
 *
 * This worker is the SINGLE consumer of notification.match.queue.
 * adWorker must NOT register a handler for these job names.
 */
const createNoopWorker = <T>() => ({
    on: () => undefined,
    close: async () => undefined,
} as unknown as Worker<T>);

export const notificationMatchWorker = shouldDisableQueueConnection
    ? createNoopWorker()
    : new Worker(
        'notification.match.queue',
        async (job) => {
            const traceId = (job.data as { _trace?: { requestId?: string } } | undefined)?._trace?.requestId || `job-${String(job.id || 'unknown')}`;
            const traceUserId = (job.data as { _trace?: { userId?: string } } | undefined)?._trace?.userId;
            TraceContext.setCorrelationId(traceId);
            setReliabilityContext({
                traceId,
                userId: traceUserId,
                queueName: 'notification.match.queue',
                jobId: job.id ? String(job.id) : undefined,
                jobName: job.name,
                requestPath: `queue://notification.match.queue/${job.name}`,
                method: 'QUEUE',
            });
            try {

            // ── Job: Smart Alert Fan-out ────────────────────────────────────────────
            if (job.name === 'process_smart_alerts') {
                const { adId } = job.data as { adId: string };
                logger.info(`[NotificationMatchWorker] Starting smart alert match for Ad ${adId}`, {
                    jobId: job.id,
                    queue: 'notification.match.queue'
                });

                try {
                    await processAdForAlerts(adId);
                    await enqueueSavedSearchAlertDispatch(adId);
                    logger.info(`[NotificationMatchWorker] Completed smart alert match for Ad ${adId}`, {
                        jobId: job.id
                    });
                } catch (error) {
                    logger.error(`[NotificationMatchWorker] Failed smart alert match for Ad ${adId}`, {
                        jobId: job.id,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    throw error; // Propagate for BullMQ exponential backoff
                }
            }

            // ── Job: Saved Search Alert Dispatch ───────────────────────────────────
            else if (job.name === 'alertDispatchJob') {
                const { adId } = job.data as { adId: string };
                logger.info(`[NotificationMatchWorker] Dispatching saved search alerts for Ad ${adId}`, {
                    jobId: job.id
                });

                try {
                    await processSavedSearchAlertDispatch(adId);
                    logger.info(`[NotificationMatchWorker] Saved search alert dispatch complete for Ad ${adId}`, {
                        jobId: job.id
                    });
                } catch (error) {
                    logger.error(`[NotificationMatchWorker] Failed saved search alert dispatch for Ad ${adId}`, {
                        jobId: job.id,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    throw error;
                }
            }

            else {
                logger.warn(`[NotificationMatchWorker] Unknown job type received — skipping`, {
                    jobName: job.name,
                    jobId: job.id
                });
            }
            } finally {
                TraceContext.clear();
                clearReliabilityContext();
            }
        },
        {
            connection: redisConnection as any,
            concurrency: 10, // Conservative: each job triggers Mongo fan-out queries
            settings: {
                backoffStrategy: (attemptsMade: number) => {
                    // Exponential: 2s → 4s → 8s capped at 30s
                    return queueWorkerBackoffStrategy(attemptsMade, 2_000, 30_000);
                }
            }
        }
    );

if (!shouldDisableQueueConnection) {
    notificationMatchWorker.on('failed', (job, err) => {
        if (job) {
            logger.error(`[NotificationMatchWorker] Job ${job.id} (${job.name}) permanently failed`, {
                error: err.message,
                attempts: job.attemptsMade,
                attemptsConfigured: job.opts.attempts || 1,
            });
            void enqueueDeadLetter('notification.match.queue', job, err);
        } else {
            logger.error(`[NotificationMatchWorker] Unknown job failure`, { error: err.message });
        }
    });

    notificationMatchWorker.on('completed', (job) => {
        logger.debug(`[NotificationMatchWorker] Job ${job.id} (${job.name}) completed successfully`);
    });

    notificationMatchWorker.on('error', (err) => {
        logger.error('[NotificationMatchWorker] Worker runtime error', {
            error: err.message
        });
    });
}
