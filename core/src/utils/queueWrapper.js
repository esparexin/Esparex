"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addJobWithTrace = addJobWithTrace;
exports.registerWorkerWithTrace = registerWorkerWithTrace;
const bullmq_1 = require("bullmq");
const trace_1 = require("@shared/observability/trace");
const logger_1 = __importDefault(require("./logger"));
const AuditService_1 = require("@core/services/AuditService");
/**
 * Standardized job addition with Trace ID injection
 */
async function addJobWithTrace(queue, name, data, opts = {}, userId) {
    const requestId = trace_1.TraceContext.getCorrelationId();
    const enrichedData = {
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
function registerWorkerWithTrace(queueName, processor, workerOptions) {
    const tracedProcessor = async (job) => {
        const requestId = job.data._trace?.requestId || `job-${job.id}`;
        // Restore context for all logs and nested service calls within this job
        trace_1.TraceContext.setCorrelationId(requestId);
        try {
            return await processor(job);
        }
        catch (error) {
            // Internal error logging within the traced context
            logger_1.default.error(`[JobError] ${queueName}:${job.name} failed`, {
                jobId: job.id,
                requestId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
        finally {
            trace_1.TraceContext.clear();
        }
    };
    const worker = new bullmq_1.Worker(queueName, tracedProcessor, workerOptions);
    worker.on('failed', (job, err) => {
        if (!job)
            return;
        // Log to Admin Audit if retries are exhausted
        if (job.attemptsMade >= (job.opts.attempts || 1)) {
            const requestId = job.data._trace?.requestId;
            void AuditService_1.AuditService.logEvent({
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
            }, { actorType: 'system', requestId });
            logger_1.default.error(`[JobFatal] ${queueName}:${job.name} exhausted all retries.`, {
                jobId: job.id,
                requestId,
                error: err.message
            });
        }
    });
    return worker;
}
//# sourceMappingURL=queueWrapper.js.map