import { Worker } from 'bullmq';
import { redisConnection, shouldDisableQueueConnection } from '../queues/redisConnection';
import { NotificationDispatcher } from '../services/notification/NotificationDispatcher';
import { NotificationIntent } from '../domains/identity';
import logger from '../utils/logger';
import { enqueueDeadLetter } from '../queues/deadLetterQueue';
import { queueWorkerBackoffStrategy } from '../queues/queueDefaults';
import { TraceContext } from '@esparex/shared';
import { clearReliabilityContext, setReliabilityContext } from '../utils/reliabilityContext';

/**
 * Notification Delivery Worker
 * Domain: notification
 * Queue:  notification.delivery.queue
 *
 * Responsibilities:
 *  1. Execute the final delivery of notifications (DB, WebSocket, FCM).
 *  2. Provide retry logic for failed push attempts.
 */
const createNoopWorker = <T>() => ({
    on: () => undefined,
    close: async () => undefined,
} as unknown as Worker<T>);

export const notificationDeliveryProcessor = async (job: any) => {
    const traceId = (job.data as { _trace?: { requestId?: string } } | undefined)?._trace?.requestId || `job-${String(job.id || 'unknown')}`;
    const traceUserId = (job.data as { _trace?: { userId?: string } } | undefined)?._trace?.userId;
    TraceContext.setCorrelationId(traceId);
    setReliabilityContext({
        traceId,
        userId: traceUserId,
        queueName: 'notification.delivery.queue',
        jobId: job.id ? String(job.id) : undefined,
        jobName: job.name,
        requestPath: `queue://notification.delivery.queue/${job.name}`,
        method: 'QUEUE',
    });
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
    } finally {
        TraceContext.clear();
        clearReliabilityContext();
    }
};

export const notificationDeliveryWorker = shouldDisableQueueConnection
    ? createNoopWorker()
    : new Worker(
        'notification.delivery.queue',
        notificationDeliveryProcessor,
        {
            connection: redisConnection,
            concurrency: 50, // High concurrency for network-bound tasks (FCM, WebSocket)
            settings: {
                backoffStrategy: (attemptsMade: number) => {
                    // Exponential: 5s → 10s → 20s → 40s → 80s
                    return queueWorkerBackoffStrategy(attemptsMade, 5_000, 600_000);
                }
            }
        }
    );

if (!shouldDisableQueueConnection) {
    notificationDeliveryWorker.on('failed', (job, err) => {
        if (job) {
            logger.error(`[NotificationDeliveryWorker] Delivery Job ${job.id} permanently failed`, {
                error: err.message,
                attempts: job.attemptsMade,
                attemptsConfigured: job.opts.attempts || 1,
            });
            void enqueueDeadLetter('notification.delivery.queue', job, err);
        }
    });

    notificationDeliveryWorker.on('completed', (job) => {
        logger.debug(`[NotificationDeliveryWorker] Delivery Job ${job.id} completed successfully`);
    });

    notificationDeliveryWorker.on('error', (err) => {
        logger.error('[NotificationDeliveryWorker] Worker runtime error', {
            error: err.message
        });
    });
}
