import { Queue, Worker, QueueEvents, Job, type Processor } from 'bullmq';
import logger from '../utils/logger';

export type SchedulerJobName =
    | 'expire_ads_job'
    | 'suspend_expired_businesses'
    | 'notify_business_expiry'
    | 'payment_reconciliation'
    | 'monthly_slot_reset'
    | 'database_backup_job'
    | 'location_analytics_refresh'
    | 'notification_scheduler_poll'
    | 'cleanup_read_notifications'
    | 's3_garbage_collector_job'
    | 'admin_metrics_cache_job'
    | 'home_feed_warmup'
    | 'quality_score_backfill_job';

type SchedulerProcessor = (job: Job) => Promise<unknown>;

const shouldDisableSchedulerQueue =
    process.env.NODE_ENV === 'test' && process.env.ALLOW_SCHEDULER_QUEUE !== 'true';

const schedulerRepeatCrons: Record<SchedulerJobName, string> = {
    expire_ads_job: '1 0 * * *',
    suspend_expired_businesses: '0 0 * * *',
    notify_business_expiry: '0 9 * * *',
    payment_reconciliation: '*/10 * * * *',
    monthly_slot_reset: '5 0 1 * *',
    database_backup_job: process.env.BACKUP_CRON_SCHEDULE || '0 2 * * *',
    location_analytics_refresh: '0 2 * * *',
    notification_scheduler_poll: '* * * * *',
    cleanup_read_notifications: '0 * * * *',
    s3_garbage_collector_job: '0 2 * * *',
    admin_metrics_cache_job: '0 1 * * *',
    home_feed_warmup: '* * * * *',
    quality_score_backfill_job: '*/5 * * * *',
};

const parseRedisConnection = () => {
    if (process.env.REDIS_URL) {
        const parsedUrl = new URL(process.env.REDIS_URL);
        const dbFromPath = Number(parsedUrl.pathname.replace('/', '') || '0');
        return {
            host: parsedUrl.hostname || 'localhost',
            port: Number(parsedUrl.port || '6379'),
            password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
            db: Number.isFinite(dbFromPath) ? dbFromPath : Number(process.env.REDIS_DB || '0'),
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
        };
    }

    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    };
};

const schedulerQueueConnection = parseRedisConnection();
const schedulerDefaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 2000,
    },
    removeOnComplete: 200,
    removeOnFail: 500,
};

const schedulerQueue = shouldDisableSchedulerQueue
    ? null
    : new Queue<unknown, unknown, string>('scheduler-jobs', {
        connection: schedulerQueueConnection,
        defaultJobOptions: schedulerDefaultJobOptions,
    });

let processorsRegistered = false;
let schedulerWorker: Worker<unknown, unknown, string> | null = null;
let schedulerQueueEvents: QueueEvents | null = null;

export const registerSchedulerJobProcessors = async (
    processors: Record<SchedulerJobName, SchedulerProcessor>
) => {
    if (shouldDisableSchedulerQueue || processorsRegistered) return;

    const processor: Processor<unknown, unknown, string> = async (job) => {
        const handler = processors[job.name as SchedulerJobName];
        if (!handler) {
            throw new Error(`No scheduler processor registered for job ${job.name}`);
        }
        return handler(job as Job);
    };

    schedulerWorker = new Worker<unknown, unknown, string>('scheduler-jobs', processor, {
        connection: schedulerQueueConnection,
        concurrency: 1,
    });

    schedulerQueueEvents = new QueueEvents('scheduler-jobs', {
        connection: schedulerQueueConnection,
    });

    schedulerQueueEvents.on('completed', ({ jobId }) => {
        logger.info('Scheduler queue job completed', { jobId });
    });

    schedulerQueueEvents.on('failed', ({ jobId, failedReason }) => {
        logger.error('Scheduler queue job failed', {
            jobId,
            error: failedReason,
        });
    });

    schedulerWorker.on('failed', (job, error) => {
        logger.error('Scheduler worker execution failed', {
            jobName: job?.name,
            jobId: job?.id,
            error: error.message,
        });
    });

    processorsRegistered = true;
    await Promise.all([schedulerWorker.waitUntilReady(), schedulerQueueEvents.waitUntilReady()]);
};

export const registerSchedulerRepeatableJobs = async () => {
    if (shouldDisableSchedulerQueue || !schedulerQueue) return;

    const timezone = process.env.TZ || 'Asia/Kolkata';
    for (const [jobName, cron] of Object.entries(schedulerRepeatCrons) as Array<[SchedulerJobName, string]>) {
        await schedulerQueue.upsertJobScheduler(
            `repeat:${jobName}`,
            {
                pattern: cron,
                tz: timezone,
            },
            {
                name: jobName,
                data: { trigger: 'repeatable' },
                opts: schedulerDefaultJobOptions,
            },
        );
    }

    logger.info('Scheduler repeatable jobs registered', {
        count: Object.keys(schedulerRepeatCrons).length,
        timezone
    });
};

export const closeSchedulerQueue = async () => {
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

export { shouldDisableSchedulerQueue, schedulerRepeatCrons };
export default schedulerQueue;
