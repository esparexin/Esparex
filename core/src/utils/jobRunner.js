"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRunner = void 0;
const JobLog_1 = __importDefault(require("@core/models/JobLog"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Wraps a job function with persistent logging.
 * Usage: jobRunner('MyJob', async () => { ...job logic... });
 */
const jobRunner = async (jobName, jobFn, triggeredBy = 'cron') => {
    const startedAt = new Date();
    // Persist 'started' state immediately
    let logEntry;
    try {
        logEntry = await JobLog_1.default.create({
            jobName,
            status: 'started',
            startedAt,
            triggeredBy
        });
    }
    catch (dbError) {
        logger_1.default.error(`Failed to create start log for ${jobName}`, dbError);
        // Continue execution even if logging fails? 
        // Yes, core logic is more important than logs.
    }
    try {
        const result = await jobFn();
        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();
        if (logEntry) {
            logEntry.status = 'success';
            logEntry.result = result;
            logEntry.completedAt = completedAt;
            logEntry.durationMs = durationMs;
            await logEntry.save();
        }
        else {
            // If start log failed, try creating a comprehensive one now
            await JobLog_1.default.create({
                jobName,
                status: 'success',
                result,
                startedAt,
                completedAt,
                durationMs,
                triggeredBy
            });
        }
        return result;
    }
    catch (error) {
        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error(`Job ${jobName} failed:`, error);
        if (logEntry) {
            logEntry.status = 'failed';
            logEntry.error = errorMessage;
            logEntry.completedAt = completedAt;
            logEntry.durationMs = durationMs;
            await logEntry.save();
        }
        else {
            await JobLog_1.default.create({
                jobName,
                status: 'failed',
                error: errorMessage,
                startedAt,
                completedAt,
                durationMs,
                triggeredBy
            });
        }
        // Re-throw if critical? Usually cron failure shouldn't crash process.
        // We caught it, logged it. No re-throw needed for node-cron.
    }
};
exports.jobRunner = jobRunner;
//# sourceMappingURL=jobRunner.js.map