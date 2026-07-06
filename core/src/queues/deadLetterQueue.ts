import { type Job, Queue } from 'bullmq';
import logger from '../utils/logger';
import { redisConnection, shouldDisableQueueConnection } from './redisConnection';
import { buildDeterministicJobId } from './queueIdempotency';
import { createNoopQueue, withQueueDefaults } from './queueDefaults';
import { captureException } from '../infrastructure/telemetry/sentry';
import { emitReliabilityAlert } from '../infrastructure/telemetry/reliabilityAlerts';
import { reliabilityAlertsTotal } from '../infrastructure/telemetry/metrics';

export interface DeadLetterQueueJobData {
    sourceQueue: string;
    sourceJobId: string;
    sourceJobName: string;
    sourceAttemptsMade: number;
    sourceAttemptsConfigured: number;
    failedAt: string;
    errorMessage: string;
    payload: unknown;
    _trace?: {
        requestId: string;
        userId?: string;
    };
}



export const deadLetterQueue = shouldDisableQueueConnection
    ? createNoopQueue<DeadLetterQueueJobData>()
    : new Queue<DeadLetterQueueJobData>('dead-letter-events', {
        connection: redisConnection,
        defaultJobOptions: withQueueDefaults({
            attempts: 1,
            removeOnComplete: 2_000,
            removeOnFail: 2_000,
        }),
    });

const isTerminalFailure = (job: Job | undefined | null): boolean => {
    if (!job) return false;
    const configuredAttempts = job.opts.attempts || 1;
    return job.attemptsMade >= configuredAttempts;
};

export const enqueueDeadLetter = async (
    sourceQueue: string,
    job: Job | undefined | null,
    error: unknown
): Promise<void> => {
    if (!job || !isTerminalFailure(job)) return;

    const deadLetterData: DeadLetterQueueJobData = {
        sourceQueue,
        sourceJobId: String(job.id || 'unknown'),
        sourceJobName: job.name,
        sourceAttemptsMade: job.attemptsMade,
        sourceAttemptsConfigured: job.opts.attempts || 1,
        failedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error),
        payload: job.data,
        _trace: (job.data as { _trace?: { requestId: string; userId?: string } } | undefined)?._trace,
    };

    const deadLetterJobId = buildDeterministicJobId(
        `dlq:${sourceQueue}:${job.name}:${String(job.id || 'unknown')}`,
        deadLetterData
    );

    try {
        await deadLetterQueue.add(
            'dead_letter_job',
            deadLetterData,
            withQueueDefaults({
                attempts: 1,
                jobId: deadLetterJobId,
                removeOnComplete: 2_000,
                removeOnFail: 2_000,
            })
        );
        logger.error('[DLQ] queued terminal failure', {
            sourceQueue,
            sourceJobId: job.id,
            sourceJobName: job.name,
            attemptsMade: job.attemptsMade,
        });

        reliabilityAlertsTotal.labels('DLQ_JOB_ENTERED', 'critical').inc();
        await emitReliabilityAlert({
            type: 'DLQ_JOB_ENTERED',
            title: 'Dead-letter queue escalation',
            severity: 'critical',
            summary: `Job moved to DLQ from ${sourceQueue}`,
            dedupeKey: `dlq:${sourceQueue}:${job.name}:${String(job.id || 'unknown')}`,
            metadata: {
                jobType: deadLetterData.sourceJobName,
                payload: deadLetterData.payload,
                error: deadLetterData.errorMessage,
                timestamp: deadLetterData.failedAt,
                sourceQueue: deadLetterData.sourceQueue,
                sourceJobId: deadLetterData.sourceJobId,
                attemptsMade: deadLetterData.sourceAttemptsMade,
                attemptsConfigured: deadLetterData.sourceAttemptsConfigured,
            },
        });
    } catch (dlqError) {
        logger.error('[DLQ] failed to enqueue terminal failure', {
            sourceQueue,
            sourceJobId: job.id,
            error: dlqError instanceof Error ? dlqError.message : String(dlqError),
        });
        captureException(dlqError instanceof Error ? dlqError : new Error(String(dlqError)), {
            sourceQueue,
            sourceJobId: String(job.id || 'unknown'),
            sourceJobName: job.name,
            phase: 'dlq_enqueue_failure',
        });
        reliabilityAlertsTotal.labels('DLQ_ENQUEUE_FAILURE', 'critical').inc();
        await emitReliabilityAlert({
            type: 'DLQ_ENQUEUE_FAILURE',
            title: 'Dead-letter queue enqueue failure',
            severity: 'critical',
            summary: `Failed to enqueue DLQ job for ${sourceQueue}`,
            dedupeKey: `dlq_enqueue_failure:${sourceQueue}`,
            metadata: {
                sourceQueue,
                sourceJobId: String(job.id || 'unknown'),
                sourceJobName: job.name,
                enqueueError: dlqError instanceof Error ? dlqError.message : String(dlqError),
            },
        });
    }
};
