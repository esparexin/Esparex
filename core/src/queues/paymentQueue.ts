import { Queue } from "bullmq";
import logger from "../utils/logger";
import { redisConnection } from "./redisConnection";

export type PaymentQueueJobName = "process_payment_capture";

export interface PaymentQueueJobData {
    event: string;
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    gatewayAmountPaise?: number;
    gatewayCurrency?: string;
}

export const paymentQueue = new Queue<PaymentQueueJobData, void, PaymentQueueJobName>("payment-events", {
    connection: redisConnection,
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

export async function enqueuePaymentProcessing(job: PaymentQueueJobData) {
    const jobId = `payment:${job.gatewayPaymentId || job.gatewayOrderId || `${job.event}:${Date.now()}`}`;

    try {
        const existingJob = await paymentQueue.getJob(jobId);
        if (existingJob) {
            logger.info("Duplicate payment webhook enqueue skipped", {
                jobId,
                gatewayPaymentId: job.gatewayPaymentId,
                gatewayOrderId: job.gatewayOrderId
            });
            return existingJob;
        }

        return paymentQueue.add("process_payment_capture", job, { jobId });
    } catch (error) {
        logger.error("Failed to enqueue payment processing job", {
            jobId,
            gatewayPaymentId: job.gatewayPaymentId,
            gatewayOrderId: job.gatewayOrderId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

export default paymentQueue;
