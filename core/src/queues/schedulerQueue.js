"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulerRepeatCrons = exports.shouldDisableSchedulerQueue = exports.closeSchedulerQueue = exports.registerSchedulerRepeatableJobs = exports.registerSchedulerJobProcessors = void 0;
const bullmq_1 = require("bullmq");
const logger_1 = __importDefault(require("@core/utils/logger"));
const env_1 = require("@core/config/env");
const queueWrapper_1 = require("@core/utils/queueWrapper");
const shouldDisableSchedulerQueue = env_1.env.NODE_ENV === 'test' && !env_1.env.ALLOW_SCHEDULER_QUEUE;
exports.shouldDisableSchedulerQueue = shouldDisableSchedulerQueue;
const schedulerRepeatCrons = {
    expire_ads_job: '1 0 * * *',
    suspend_expired_businesses: '0 0 * * *',
    notify_business_expiry: '0 9 * * *',
    payment_reconciliation: '*/10 * * * *',
    monthly_slot_reset: '5 0 1 * *',
    expire_user_plans: '0 1 * * *',
    database_backup_job: env_1.env.BACKUP_CRON_SCHEDULE,
    location_analytics_refresh: '0 2 * * *',
    notification_scheduler_poll: '* * * * *',
    cleanup_read_notifications: '0 * * * *',
    s3_garbage_collector_job: '0 2 * * *',
    admin_metrics_cache_job: '0 1 * * *',
    home_feed_warmup: '* * * * *',
    quality_score_backfill_job: '*/5 * * * *',
};
exports.schedulerRepeatCrons = schedulerRepeatCrons;
const parseRedisConnection = () => {
    if (env_1.env.REDIS_URL) {
        const parsedUrl = new URL(env_1.env.REDIS_URL);
        const dbFromPath = Number(parsedUrl.pathname.replace('/', '') || '0');
        return {
            host: parsedUrl.hostname || 'localhost',
            port: Number(parsedUrl.port || '6379'),
            password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
            db: Number.isFinite(dbFromPath) ? dbFromPath : env_1.env.REDIS_DB,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            tls: undefined, // 🔒 FORCE DISABLE TLS
        };
    }
    return {
        host: env_1.env.REDIS_HOST,
        port: env_1.env.REDIS_PORT,
        password: env_1.env.REDIS_PASSWORD,
        db: env_1.env.REDIS_DB,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: undefined, // 🔒 FORCE DISABLE TLS
    };
};
const schedulerQueueConnection = parseRedisConnection();
const schedulerDefaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000,
    },
    removeOnComplete: 200,
    removeOnFail: 500,
};
const schedulerQueue = shouldDisableSchedulerQueue
    ? null
    : new bullmq_1.Queue('scheduler-jobs', {
        connection: schedulerQueueConnection,
        defaultJobOptions: schedulerDefaultJobOptions,
    });
let processorsRegistered = false;
let schedulerWorker = null;
let schedulerQueueEvents = null;
const registerSchedulerJobProcessors = async (processors) => {
    if (shouldDisableSchedulerQueue || processorsRegistered)
        return;
    processorsRegistered = true;
    const processor = async (job) => {
        const handler = processors[job.name];
        if (!handler) {
            throw new Error(`No scheduler processor registered for job ${job.name}`);
        }
        return handler(job);
    };
    schedulerWorker = (0, queueWrapper_1.registerWorkerWithTrace)('scheduler-jobs', processor, {
        connection: schedulerQueueConnection,
        concurrency: 1,
    });
    schedulerQueueEvents = new bullmq_1.QueueEvents('scheduler-jobs', {
        connection: schedulerQueueConnection,
    });
    schedulerQueueEvents.on('completed', ({ jobId }) => {
        logger_1.default.info('Scheduler queue job completed', { jobId });
    });
    await Promise.all([
        schedulerWorker?.waitUntilReady(),
        schedulerQueueEvents?.waitUntilReady()
    ].filter(Boolean));
};
exports.registerSchedulerJobProcessors = registerSchedulerJobProcessors;
const registerSchedulerRepeatableJobs = async () => {
    if (shouldDisableSchedulerQueue || !schedulerQueue)
        return;
    const timezone = env_1.env.TZ;
    for (const [jobName, cron] of Object.entries(schedulerRepeatCrons)) {
        await schedulerQueue.upsertJobScheduler(`repeat:${jobName}`, {
            pattern: cron,
            tz: timezone,
        }, {
            name: jobName,
            data: { trigger: 'repeatable' },
            opts: schedulerDefaultJobOptions,
        });
    }
    logger_1.default.info('Scheduler repeatable jobs registered', {
        count: Object.keys(schedulerRepeatCrons).length,
        timezone
    });
};
exports.registerSchedulerRepeatableJobs = registerSchedulerRepeatableJobs;
const closeSchedulerQueue = async () => {
    if (!shouldDisableSchedulerQueue && schedulerWorker) {
        await schedulerWorker.close();
        schedulerWorker = null;
    }
    if (!shouldDisableSchedulerQueue && schedulerQueueEvents) {
        await schedulerQueueEvents.close();
        schedulerQueueEvents = null;
    }
    if (!shouldDisableSchedulerQueue && schedulerQueue) {
        await schedulerQueue.close();
    }
    processorsRegistered = false;
};
exports.closeSchedulerQueue = closeSchedulerQueue;
exports.default = schedulerQueue;
//# sourceMappingURL=schedulerQueue.js.map