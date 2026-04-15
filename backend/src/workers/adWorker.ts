import { Worker } from "bullmq";
import { redisConnection } from "../queues/redisConnection";
import logger from "../utils/logger";
// Notification matching is handled exclusively by notificationMatchWorker.ts

/**
 * Ad Events Worker — ad-domain tasks only.
 * Smart Alert matching has been relocated to notificationMatchWorker.ts.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export const adWorker = new Worker("ad-events", async job => {
    // [AdWorker] Matcher execution removed — handled by notificationMatchWorker
    logger.warn(`[AdWorker] Unhandled job on ad-events queue`, { jobName: job.name, jobId: job.id });
}, {
    connection: redisConnection,
    concurrency: 5
});

adWorker.on('failed', (job, err) => {
    if (job) {
        logger.error(`Job ${job.id} failed with error: ${err.message}`);
    } else {
        logger.error(`Worker error: ${err.message}`);
    }
});

// eslint-disable-next-line @typescript-eslint/require-await
export const notificationDeliveryWorker = new Worker("notification.delivery.queue", async job => {
    // Legacy fallback handler removed: Notification Intents are now structurally instantiated upstream.
    // If you plan to use this queue for delayed routing, construct NotificationIntents
    // and explicitly pass them into the NotificationDispatcher inside this callback.
    logger.warn(`[NotificationWorker] Deprecated generic job arrived on delivery queue`, { jobName: job.name });
}, {
    connection: redisConnection,
    concurrency: 50 // High concurrency for network I/O bounds
});

notificationDeliveryWorker.on('failed', (job, err) => {
    if (job) {
        logger.error(`Push Job ${job.id} failed with error: ${err.message}`);
    } else {
        logger.error(`Push Worker error: ${err.message}`);
    }
});

// notificationMatchWorker has been relocated to: workers/notificationMatchWorker.ts
