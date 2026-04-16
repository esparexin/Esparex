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

// notificationMatchWorker has been relocated to: workers/notificationMatchWorker.ts

