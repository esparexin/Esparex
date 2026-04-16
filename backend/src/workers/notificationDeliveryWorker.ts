import { Worker } from 'bullmq';
import { redisConnection } from '../queues/redisConnection';
import { NotificationDispatcher, type NotificationDispatchResult } from '../services/notification/NotificationDispatcher';
import { NotificationIntent } from '../domain/NotificationIntent';
import logger from '../utils/logger';

/**
 * Notification Delivery Worker
 * Domain: notification
 * Queue:  notification.delivery.queue
 *
 * Responsibilities:
 *  1. Execute the final delivery of notifications (DB, WebSocket, FCM).
 *  2. Provide retry logic for failed push attempts.
 */
export const notificationDeliveryWorker = new Worker(
    'notification.delivery.queue',
    async (job) => {
        const { intent, options } = job.data as {
            intent: ConstructorParameters<typeof NotificationIntent>[0];
            options: { shadowDispatch?: boolean }
        };

        logger.info(`[NotificationDeliveryWorker] Processing ${job.name} for User ${intent.userId}`, {
            jobId: job.id,
            type: intent.type
        });

        try {
            // Reconstruct the intent object to ensure all defaults are applied 
            // and any internal logic runs (though executeDispatch uses properties mostly).
            const notificationIntent = new NotificationIntent(intent);
            
            await NotificationDispatcher.executeDispatch(notificationIntent, options);
            
            logger.info(`[NotificationDeliveryWorker] Completed delivery for User ${intent.userId}`, {
                jobId: job.id
            });
        } catch (error) {
            logger.error(`[NotificationDeliveryWorker] Failed delivery for User ${intent.userId}`, {
                jobId: job.id,
                error: error instanceof Error ? error.message : String(error)
            });
            // Propagate error to BullMQ for retry (configured in adQueue.ts defaultJobOptions)
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 50, // High concurrency for network-bound tasks (FCM, WebSocket)
        settings: {
            backoffStrategy: (attemptsMade: number) => {
                // Exponential: 5s → 10s → 20s → 40s → 80s
                return Math.min(5000 * Math.pow(2, attemptsMade - 1), 600_000);
            }
        }
    }
);

notificationDeliveryWorker.on('failed', (job, err) => {
    if (job) {
        logger.error(`[NotificationDeliveryWorker] Delivery Job ${job.id} permanently failed`, {
            error: err.message,
            attempts: job.attemptsMade
        });
    }
});

notificationDeliveryWorker.on('completed', (job) => {
    logger.debug(`[NotificationDeliveryWorker] Delivery Job ${job.id} completed successfully`);
});
