"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationMatchWorker = void 0;
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("@core/queues/redisConnection");
const SmartAlertService_1 = require("@core/services/SmartAlertService");
const SavedSearchService_1 = require("@core/services/SavedSearchService");
const logger_1 = __importDefault(require("@core/utils/logger"));
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
exports.notificationMatchWorker = new bullmq_1.Worker('notification.match.queue', async (job) => {
    // ── Job: Smart Alert Fan-out ────────────────────────────────────────────
    if (job.name === 'process_smart_alerts') {
        const { adId } = job.data;
        logger_1.default.info(`[NotificationMatchWorker] Starting smart alert match for Ad ${adId}`, {
            jobId: job.id,
            queue: 'notification.match.queue'
        });
        try {
            await (0, SmartAlertService_1.processAdForAlerts)(adId);
            await (0, SavedSearchService_1.enqueueSavedSearchAlertDispatch)(adId);
            logger_1.default.info(`[NotificationMatchWorker] Completed smart alert match for Ad ${adId}`, {
                jobId: job.id
            });
        }
        catch (error) {
            logger_1.default.error(`[NotificationMatchWorker] Failed smart alert match for Ad ${adId}`, {
                jobId: job.id,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error; // Propagate for BullMQ exponential backoff
        }
    }
    // ── Job: Saved Search Alert Dispatch ───────────────────────────────────
    else if (job.name === 'alertDispatchJob') {
        const { adId } = job.data;
        logger_1.default.info(`[NotificationMatchWorker] Dispatching saved search alerts for Ad ${adId}`, {
            jobId: job.id
        });
        try {
            await (0, SavedSearchService_1.processSavedSearchAlertDispatch)(adId);
            logger_1.default.info(`[NotificationMatchWorker] Saved search alert dispatch complete for Ad ${adId}`, {
                jobId: job.id
            });
        }
        catch (error) {
            logger_1.default.error(`[NotificationMatchWorker] Failed saved search alert dispatch for Ad ${adId}`, {
                jobId: job.id,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    else {
        logger_1.default.warn(`[NotificationMatchWorker] Unknown job type received — skipping`, {
            jobName: job.name,
            jobId: job.id
        });
    }
}, {
    connection: redisConnection_1.redisConnection,
    concurrency: 10, // Conservative: each job triggers Mongo fan-out queries
    settings: {
        backoffStrategy: (attemptsMade) => {
            // Exponential: 2s → 4s → 8s capped at 30s
            return Math.min(2000 * Math.pow(2, attemptsMade - 1), 30_000);
        }
    }
});
exports.notificationMatchWorker.on('failed', (job, err) => {
    if (job) {
        logger_1.default.error(`[NotificationMatchWorker] Job ${job.id} (${job.name}) permanently failed`, {
            error: err.message,
            attempts: job.attemptsMade
        });
    }
    else {
        logger_1.default.error(`[NotificationMatchWorker] Unknown job failure`, { error: err.message });
    }
});
exports.notificationMatchWorker.on('completed', (job) => {
    logger_1.default.debug(`[NotificationMatchWorker] Job ${job.id} (${job.name}) completed successfully`);
});
//# sourceMappingURL=notificationMatchWorker.js.map