"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationDeliveryWorker = void 0;
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("@core/queues/redisConnection");
const NotificationDispatcher_1 = require("@core/services/notification/NotificationDispatcher");
const NotificationIntent_1 = require("../domain/NotificationIntent");
const logger_1 = __importDefault(require("@core/utils/logger"));
/**
 * Notification Delivery Worker
 * Domain: notification
 * Queue:  notification.delivery.queue
 *
 * Responsibilities:
 *  1. Execute the final delivery of notifications (DB, WebSocket, FCM).
 *  2. Provide retry logic for failed push attempts.
 */
exports.notificationDeliveryWorker = new bullmq_1.Worker('notification.delivery.queue', async (job) => {
    const { intent, options } = job.data;
    logger_1.default.info(`[NotificationDeliveryWorker] Processing ${job.name} for User ${intent.userId}`, {
        jobId: job.id,
        type: intent.type
    });
    try {
        // Reconstruct the intent object to ensure all defaults are applied 
        // and any internal logic runs (though executeDispatch uses properties mostly).
        const notificationIntent = new NotificationIntent_1.NotificationIntent(intent);
        await NotificationDispatcher_1.NotificationDispatcher.executeDispatch(notificationIntent, options);
        logger_1.default.info(`[NotificationDeliveryWorker] Completed delivery for User ${intent.userId}`, {
            jobId: job.id
        });
    }
    catch (error) {
        logger_1.default.error(`[NotificationDeliveryWorker] Failed delivery for User ${intent.userId}`, {
            jobId: job.id,
            error: error instanceof Error ? error.message : String(error)
        });
        // Propagate error to BullMQ for retry (configured in adQueue.ts defaultJobOptions)
        throw error;
    }
}, {
    connection: redisConnection_1.redisConnection,
    concurrency: 50, // High concurrency for network-bound tasks (FCM, WebSocket)
    settings: {
        backoffStrategy: (attemptsMade) => {
            // Exponential: 5s → 10s → 20s → 40s → 80s
            return Math.min(5000 * Math.pow(2, attemptsMade - 1), 600_000);
        }
    }
});
exports.notificationDeliveryWorker.on('failed', (job, err) => {
    if (job) {
        logger_1.default.error(`[NotificationDeliveryWorker] Delivery Job ${job.id} permanently failed`, {
            error: err.message,
            attempts: job.attemptsMade
        });
    }
});
exports.notificationDeliveryWorker.on('completed', (job) => {
    logger_1.default.debug(`[NotificationDeliveryWorker] Delivery Job ${job.id} completed successfully`);
});
//# sourceMappingURL=notificationDeliveryWorker.js.map