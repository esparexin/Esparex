import { Queue } from "bullmq";
import logger from "../utils/logger";
import { isQueueConnectionAvailable, redisConnection, shouldDisableQueueConnection } from "./redisConnection";
import { createNoopQueue, withQueueDefaults } from './queueDefaults';
import {
    buildDeterministicJobId,
    releaseQueueIdempotencySlot,
    reserveQueueIdempotencySlot
} from './queueIdempotency';
import { emitReliabilityAlert } from '../utils/reliabilityAlerts';
import { reliabilityAlertsTotal } from '../utils/metrics';
import { addJobWithTrace, type TraceableJobData } from '../utils/queueWrapper';

export type PaymentQueueJobName = "process_payment_capture";

export interface PaymentQueueJobData extends TraceableJobData {
    event: string;
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    gatewayAmountPaise?: number;
    gatewayCurrency?: string;
}



export const paymentQueue = shouldDisableQueueConnection
    ? createNoopQueue<PaymentQueueJobData>()
    : new Queue<PaymentQueueJobData, void, PaymentQueueJobName>("payment-events", {
        connection: redisConnection as any,
        defaultJobOptions: withQueueDefaults({
            removeOnComplete: 500,
            removeOnFail: 1_000
        })
    });

export async function enqueuePaymentProcessing(job: PaymentQueueJobData) {
    if (!isQueueConnectionAvailable()) {
        reliabilityAlertsTotal.labels('QUEUE_PAUSED_REDIS_UNAVAILABLE', 'high').inc();
        void emitReliabilityAlert({
            type: 'QUEUE_PAUSED_REDIS_UNAVAILABLE',
            title: 'Queue paused due to Redis outage',
            severity: 'high',
            summary: 'payment-events queue is unavailable',
            dedupeKey: 'queue_paused_payment_events',
            metadata: {
                queueName: 'payment-events',
                gatewayPaymentId: job.gatewayPaymentId,
                gatewayOrderId: job.gatewayOrderId,
            },
        });
        throw new Error('Queue unavailable: payment-events');
    }

    const jobId = job.gatewayPaymentId || job.gatewayOrderId
        ? `payment:${job.gatewayPaymentId || job.gatewayOrderId}`
        : buildDeterministicJobId('payment', job);

    const reserved = await reserveQueueIdempotencySlot('payment-events', jobId, 24 * 60 * 60);
    if (!reserved) {
        const existingJob = await paymentQueue.getJob(jobId).catch(() => null);
        logger.info("Duplicate payment webhook enqueue skipped", {
            jobId,
            gatewayPaymentId: job.gatewayPaymentId,
            gatewayOrderId: job.gatewayOrderId
        });
        return existingJob;
    }

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

        return addJobWithTrace(
            paymentQueue as any,
            "process_payment_capture",
            job,
            { jobId }
        );
    } catch (error) {
        await releaseQueueIdempotencySlot('payment-events', jobId);
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
