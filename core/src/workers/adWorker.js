"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adWorker = void 0;
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("../queues/redisConnection");
const logger_1 = __importDefault(require("@core/utils/logger"));
// Notification matching is handled exclusively by notificationMatchWorker.ts
/**
 * Ad Events Worker — ad-domain tasks only.
 * Smart Alert matching has been relocated to notificationMatchWorker.ts.
 */
// eslint-disable-next-line @typescript-eslint/require-await
exports.adWorker = new bullmq_1.Worker("ad-events", async (job) => {
    // [AdWorker] Matcher execution removed — handled by notificationMatchWorker
    logger_1.default.warn(`[AdWorker] Unhandled job on ad-events queue`, { jobName: job.name, jobId: job.id });
}, {
    connection: redisConnection_1.redisConnection,
    concurrency: 5
});
exports.adWorker.on('failed', (job, err) => {
    if (job) {
        logger_1.default.error(`Job ${job.id} failed with error: ${err.message}`);
    }
    else {
        logger_1.default.error(`Worker error: ${err.message}`);
    }
});
// notificationMatchWorker has been relocated to: workers/notificationMatchWorker.ts
//# sourceMappingURL=adWorker.js.map