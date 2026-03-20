import { Worker } from 'bullmq';
import { redisConnection } from '../queues/redisConnection';
import { processAdForAlerts } from '../services/SmartAlertService';
import { enqueueSavedSearchAlertDispatch, processSavedSearchAlertDispatch } from '../services/SavedSearchService';
import logger from '../utils/logger';

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
export const notificationMatchWorker = new Worker(
    'notification.match.queue',
    async (job) => {

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
    },
    {
        connection: redisConnection,
        concurrency: 10, // Conservative: each job triggers Mongo fan-out queries
        settings: {
            backoffStrategy: (attemptsMade: number) => {
                // Exponential: 2s → 4s → 8s capped at 30s
                return Math.min(2000 * Math.pow(2, attemptsMade - 1), 30_000);
            }
        }
    }
);

notificationMatchWorker.on('failed', (job, err) => {
    if (job) {
        logger.error(`[NotificationMatchWorker] Job ${job.id} (${job.name}) permanently failed`, {
            error: err.message,
            attempts: job.attemptsMade
        });
    } else {
        logger.error(`[NotificationMatchWorker] Unknown job failure`, { error: err.message });
    }
});

notificationMatchWorker.on('completed', (job) => {
    logger.debug(`[NotificationMatchWorker] Job ${job.id} (${job.name}) completed successfully`);
});
