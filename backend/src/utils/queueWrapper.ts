import { Queue, Job, type WorkerOptions, Worker, type Processor } from 'bullmq';
import { TraceContext } from '@shared/observability/trace';
import logger from './logger';
import { AuditService } from '../services/AuditService';

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
    opts: any = {},
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

    return queue.add(name, enrichedData, opts);
}

/**
 * Standardized Worker Registration with Trace Context Restoration
 */
export function registerWorkerWithTrace<T extends TraceableJobData>(
    queueName: string,
    processor: Processor<T>,
    workerOptions: WorkerOptions
) {
    const tracedProcessor: Processor<T> = async (job: Job<T>) => {
        const requestId = job.data._trace?.requestId || `job-${job.id}`;
        
        // Restore context for all logs and nested service calls within this job
        TraceContext.setCorrelationId(requestId);

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
        }
    };

    const worker = new Worker<T>(queueName, tracedProcessor, workerOptions);

    worker.on('failed', (job, err) => {
        if (!job) return;
        
        // Log to Admin Audit if retries are exhausted
        if (job.attemptsMade >= (job.opts.attempts || 1)) {
            const requestId = job.data._trace?.requestId;
            
            void AuditService.logAction({
                action: 'JOB_FAILURE_FINAL',
                targetType: 'system_queue',
                targetId: job.id || 'unknown',
                metadata: {
                    queueName,
                    jobName: job.name,
                    error: err.message,
                    requestId,
                    attempts: job.attemptsMade
                }
            });

            logger.error(`[JobFatal] ${queueName}:${job.name} exhausted all retries.`, {
                jobId: job.id,
                requestId,
                error: err.message
            });
        }
    });

    return worker;
}
