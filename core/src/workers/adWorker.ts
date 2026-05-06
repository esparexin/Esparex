import { Worker } from "bullmq";
import { redisConnection, shouldDisableQueueConnection } from "../queues/redisConnection";
import logger from "../utils/logger";
import { enqueueDeadLetter } from '../queues/deadLetterQueue';
import { TraceContext } from '@esparex/shared';
import { clearReliabilityContext, setReliabilityContext } from '../utils/reliabilityContext';
// Notification matching is handled exclusively by notificationMatchWorker.ts

/**
 * Ad Events Worker — ad-domain tasks only.
 * Smart Alert matching has been relocated to notificationMatchWorker.ts.
 */
 
const createNoopWorker = <T>() => ({
    on: () => undefined,
    close: async () => undefined,
} as unknown as Worker<T>);

export const adWorker = shouldDisableQueueConnection
    ? createNoopWorker()
    : new Worker("ad-events", async job => {
        const traceId = (job.data as { _trace?: { requestId?: string } } | undefined)?._trace?.requestId || `job-${String(job.id || 'unknown')}`;
        const traceUserId = (job.data as { _trace?: { userId?: string } } | undefined)?._trace?.userId;
        TraceContext.setCorrelationId(traceId);
        setReliabilityContext({
            traceId,
            userId: traceUserId,
            queueName: 'ad-events',
            jobId: job.id ? String(job.id) : undefined,
            jobName: job.name,
            requestPath: `queue://ad-events/${job.name}`,
            method: 'QUEUE',
        });
        try {
            // [AdWorker] Matcher execution removed — handled by notificationMatchWorker
            logger.warn(`[AdWorker] Unhandled job on ad-events queue`, { jobName: job.name, jobId: job.id });
        } catch (error) {
            logger.error('[AdWorker] Job handler failed', {
                jobId: job.id,
                jobName: job.name,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        } finally {
            TraceContext.clear();
            clearReliabilityContext();
        }
    }, {
        connection: redisConnection,
        concurrency: 5
    });

if (!shouldDisableQueueConnection) {
    adWorker.on('failed', (job, err) => {
        if (job) {
            logger.error('[AdWorker] Job failed', {
                jobId: job.id,
                jobName: job.name,
                attemptsMade: job.attemptsMade,
                attemptsConfigured: job.opts.attempts || 1,
                error: err.message,
            });
            void enqueueDeadLetter('ad-events', job, err);
        } else {
            logger.error('[AdWorker] Worker failure without job context', {
                error: err.message,
            });
        }
    });

    adWorker.on('error', (err) => {
        logger.error('[AdWorker] Worker runtime error', {
            error: err.message,
        });
    });
}

// notificationMatchWorker has been relocated to: workers/notificationMatchWorker.ts
