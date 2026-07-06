import { Queue, Job, type WorkerOptions, Worker, type Processor, type JobsOptions } from 'bullmq';
import { TraceContext } from "@esparex/shared";
import logger from '../../utils/logger';
import { AuditService } from '../../services/AuditService';
import { enqueueDeadLetter } from '../../queues/deadLetterQueue';
import { clearReliabilityContext, setReliabilityContext } from '../telemetry/reliabilityContext';
import { reliabilityAlertsTotal } from '../telemetry/metrics';
import { emitReliabilityAlert } from '../telemetry/reliabilityAlerts';

export interface TraceableJobData {
    _trace?: {
        requestId: string;
        userId?: string;
    };
    [key: string]: unknown;
}

/**
 * Standardized job addition with Trace ID injection
 */
export async function addJobWithTrace<T extends TraceableJobData>(
    queue: Queue<T>,
    name: string,
    data: T,
    opts: JobsOptions = {},
    userId?: string
) {
    const requestId = TraceContext.getCorrelationId();
    
    const enrichedData: T = {
        ...data,
        _trace: {
            requestId: requestId !== 'no-context' ? requestId : `gen-${Date.now()}`,
            userId
        }
    };

     
    type QueueAddParams = Parameters<Queue<T>['add']>;
    const typedJobName = name as QueueAddParams[0];
    const typedPayload = enrichedData as QueueAddParams[1];
    const typedOptions = opts as QueueAddParams[2];
    return queue.add(typedJobName, typedPayload, typedOptions);
}

/**
 * Standardized Worker Registration with Trace Context Restoration
 */
export function registerWorkerWithTrace<T extends TraceableJobData>(
    queueName: string,
    processor: Processor<T>,
    workerOptions: WorkerOptions
) {
    const tracedProcessor: Processor<T> = async (job: Job<T>): Promise<unknown> => {
        const requestId = job.data._trace?.requestId || `job-${job.id}`;
        
        // Restore context for all logs and nested service calls within this job
        TraceContext.setCorrelationId(requestId);
        setReliabilityContext({
            traceId: requestId,
            userId: job.data._trace?.userId,
            queueName,
            jobId: job.id ? String(job.id) : undefined,
            jobName: job.name,
            requestPath: `queue://${queueName}/${job.name}`,
            method: 'QUEUE',
        });

        try {
            return await processor(job);
        } catch (error) {
            // Internal error logging within the traced context
            logger.error(`[JobError] ${queueName}:${job.name} failed`, {
                jobId: job.id,
                requestId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        } finally {
            TraceContext.clear();
            clearReliabilityContext();
        }
    };

    const worker = new Worker<T>(queueName, tracedProcessor, workerOptions);

    worker.on('failed', (job, err) => {
        if (!job) return;
        const configuredAttempts = job.opts.attempts || 1;
        const attemptsMade = job.attemptsMade;
        const attemptsRemaining = Math.max(0, configuredAttempts - attemptsMade);
        const requestId = job.data._trace?.requestId;
        const userId = job.data._trace?.userId;

        if (configuredAttempts > 1 && attemptsMade >= configuredAttempts - 1 && attemptsMade < configuredAttempts) {
            reliabilityAlertsTotal.labels('QUEUE_RETRY_ESCALATION', 'high').inc();
            void emitReliabilityAlert({
                type: 'QUEUE_RETRY_ESCALATION',
                title: 'Queue retry nearing exhaustion',
                severity: 'high',
                summary: `${queueName}:${job.name} is approaching final retry`,
                dedupeKey: `queue_retry_escalation:${queueName}:${job.name}:${String(job.id || 'unknown')}`,
                service: 'worker-runtime',
                module: 'queue-runtime',
                metadata: {
                    queueName,
                    jobName: job.name,
                    jobId: String(job.id || 'unknown'),
                    requestId,
                    userId,
                    attemptsMade,
                    attemptsConfigured: configuredAttempts,
                    attemptsRemaining,
                    error: err.message,
                }
            });
        }

        // Log to Admin Audit if retries are exhausted
        if (attemptsMade >= configuredAttempts) {
            void AuditService.logEvent({
                action: 'JOB_FAILURE_FINAL',
                targetType: 'system_queue',
                targetId: job.id || 'unknown',
                metadata: {
                    queueName,
                    jobName: job.name,
                    error: err.message,
                    requestId,
                    attempts: attemptsMade
                }
            }, { actorType: 'system', requestId });

            logger.error(`[JobFatal] ${queueName}:${job.name} exhausted all retries.`, {
                jobId: job.id,
                requestId,
                error: err.message,
                attemptsMade,
                attemptsConfigured: configuredAttempts,
            });

            void enqueueDeadLetter(queueName, job, err);
        }
    });

    return worker;
}
