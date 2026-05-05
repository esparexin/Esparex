import { Worker } from "bullmq";
import { redisConnection } from "../queues/redisConnection";
import type { PaymentQueueJobData } from "../queues/paymentQueue";
import { processSuccessfulPayment } from "../services/PaymentProcessingService";
import logger from "../utils/logger";

export const paymentWorker = new Worker<PaymentQueueJobData, void, "process_payment_capture">(
    "payment-events",
    async (job) => {
        if (job.name !== "process_payment_capture") return;

        const { gatewayPaymentId, gatewayOrderId, gatewayAmountPaise, gatewayCurrency, event } = job.data;

        await processSuccessfulPayment({
            source: "webhook",
            event,
            gatewayPaymentId,
            gatewayOrderId,
            gatewayAmountPaise,
            gatewayCurrency
        });
    },
    {
        connection: redisConnection,
        concurrency: 5
    }
);

paymentWorker.on("failed", (job, err) => {
    logger.error("Payment worker job failed", {
        jobId: job?.id,
        jobName: job?.name,
        gatewayPaymentId: job?.data?.gatewayPaymentId,
        gatewayOrderId: job?.data?.gatewayOrderId,
        error: err.message
    });
});

