import { Worker } from "bullmq";
import { redisConnection, shouldDisableQueueConnection } from "../queues/redisConnection";
import type { PaymentQueueJobData } from "../queues/paymentQueue";
import { processSuccessfulPayment } from "../domains/payments/application/PaymentProcessingService";
import logger from "../utils/logger";
import { enqueueDeadLetter } from '../queues/deadLetterQueue';
import { queueWorkerBackoffStrategy } from '../queues/queueDefaults';
import { TraceContext } from '@esparex/shared';
import { clearReliabilityContext, setReliabilityContext } from '../utils/reliabilityContext';

const createNoopWorker = <T>() => ({
    on: () => undefined,
    close: async () => undefined,
} as unknown as Worker<T>);

export const paymentWorker = shouldDisableQueueConnection
    ? createNoopWorker<PaymentQueueJobData>()
    : new Worker<PaymentQueueJobData, void, "process_payment_capture">(
        "payment-events",
        async (job) => {
            const traceId = (job.data as { _trace?: { requestId?: string } } | undefined)?._trace?.requestId || `job-${String(job.id || 'unknown')}`;
            const traceUserId = (job.data as { _trace?: { userId?: string } } | undefined)?._trace?.userId;
            TraceContext.setCorrelationId(traceId);
            setReliabilityContext({
                traceId,
                userId: traceUserId,
                queueName: 'payment-events',
                jobId: job.id ? String(job.id) : undefined,
                jobName: job.name,
                requestPath: `queue://payment-events/${job.name}`,
                method: 'QUEUE',
            });
            try {
                if (job.name !== "process_payment_capture") {
                    logger.warn('Payment worker received unknown job', {
                        jobId: job.id,
                        jobName: job.name
                    });
                    return;
                }

                const { gatewayPaymentId, gatewayOrderId, gatewayAmountPaise, gatewayCurrency, event } = job.data;

                await processSuccessfulPayment({
                    source: "webhook",
                    event,
                    gatewayPaymentId,
                    gatewayOrderId,
                    gatewayAmountPaise,
                    gatewayCurrency
                });
            } catch (error) {
                logger.error('Payment worker processor failed', {
                    jobId: job.id,
                    jobName: job.name,
                    error: error instanceof Error ? error.message : String(error)
                });
                throw error;
            } finally {
                TraceContext.clear();
                clearReliabilityContext();
            }
        },
        {
            connection: redisConnection,
            concurrency: 5,
            settings: {
                backoffStrategy: (attemptsMade: number) => queueWorkerBackoffStrategy(attemptsMade, 3_000, 120_000),
            }
        }
    );

if (!shouldDisableQueueConnection) {
    paymentWorker.on("failed", (job, err) => {
        logger.error("Payment worker job failed", {
            jobId: job?.id,
            jobName: job?.name,
            attemptsMade: job?.attemptsMade,
            attemptsConfigured: job?.opts?.attempts || 1,
            gatewayPaymentId: job?.data?.gatewayPaymentId,
            gatewayOrderId: job?.data?.gatewayOrderId,
            error: err.message
        });
        void enqueueDeadLetter('payment-events', job, err);
    });

    paymentWorker.on('error', (err) => {
        logger.error('Payment worker runtime error', {
            error: err.message
        });
    });
}
