"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentWorker = void 0;
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("../queues/redisConnection");
const PaymentProcessingService_1 = require("@core/services/PaymentProcessingService");
const logger_1 = __importDefault(require("@core/utils/logger"));
exports.paymentWorker = new bullmq_1.Worker("payment-events", async (job) => {
    if (job.name !== "process_payment_capture")
        return;
    const { gatewayPaymentId, gatewayOrderId, gatewayAmountPaise, gatewayCurrency, event } = job.data;
    await (0, PaymentProcessingService_1.processSuccessfulPayment)({
        source: "webhook",
        event,
        gatewayPaymentId,
        gatewayOrderId,
        gatewayAmountPaise,
        gatewayCurrency
    });
}, {
    connection: redisConnection_1.redisConnection,
    concurrency: 5
});
exports.paymentWorker.on("failed", (job, err) => {
    logger_1.default.error("Payment worker job failed", {
        jobId: job?.id,
        jobName: job?.name,
        gatewayPaymentId: job?.data?.gatewayPaymentId,
        gatewayOrderId: job?.data?.gatewayOrderId,
        error: err.message
    });
});
//# sourceMappingURL=paymentWorker.js.map