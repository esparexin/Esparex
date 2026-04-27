"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentQueue = void 0;
exports.enqueuePaymentProcessing = enqueuePaymentProcessing;
const bullmq_1 = require("bullmq");
const logger_1 = __importDefault(require("@core/utils/logger"));
const redisConnection_1 = require("./redisConnection");
exports.paymentQueue = new bullmq_1.Queue("payment-events", {
    connection: redisConnection_1.redisConnection,
    defaultJobOptions: {
        attempts: 8,
        backoff: {
            type: "exponential",
            delay: 3000
        },
        removeOnComplete: 500,
        removeOnFail: 1000
    }
});
async function enqueuePaymentProcessing(job) {
    const jobId = `payment:${job.gatewayPaymentId || job.gatewayOrderId || `${job.event}:${Date.now()}`}`;
    try {
        const existingJob = await exports.paymentQueue.getJob(jobId);
        if (existingJob) {
            logger_1.default.info("Duplicate payment webhook enqueue skipped", {
                jobId,
                gatewayPaymentId: job.gatewayPaymentId,
                gatewayOrderId: job.gatewayOrderId
            });
            return existingJob;
        }
        return exports.paymentQueue.add("process_payment_capture", job, { jobId });
    }
    catch (error) {
        logger_1.default.error("Failed to enqueue payment processing job", {
            jobId,
            gatewayPaymentId: job.gatewayPaymentId,
            gatewayOrderId: job.gatewayOrderId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
exports.default = exports.paymentQueue;
//# sourceMappingURL=paymentQueue.js.map