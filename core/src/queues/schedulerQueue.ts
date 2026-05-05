import { Queue, Worker, QueueEvents, Job, type Processor } from 'bullmq';
import logger from '../utils/logger';
import { env } from '../config/env';
import { registerWorkerWithTrace, type TraceableJobData } from '../utils/queueWrapper';

export type SchedulerJobName =
    | 'expire_ads_job'
    | 'suspend_expired_businesses'
    | 'notify_business_expiry'
    | 'payment_reconciliation'
    | 'monthly_slot_reset'
    | 'expire_user_plans'
    | 'database_backup_job'
    | 'location_analytics_refresh'
    | 'notification_scheduler_poll'
    | 'cleanup_read_notifications'
    | 's3_garbage_collector_job'
    | 'admin_metrics_cache_job'
    | 'home_feed_warmup'
    | 'quality_score_backfill_job';

type SchedulerProcessor = (job: Job<TraceableJobData>) => Promise<unknown>;


const shouldDisableSchedulerQueue =
    env.NODE_ENV === 'test' && !env.ALLOW_SCHEDULER_QUEUE;

const schedulerRepeatCrons: Record<SchedulerJobName, string> = {
    expire_ads_job: '1 0 * * *',
    suspend_expired_businesses: '0 0 * * *',
    notify_business_expiry: '0 9 * * *',
    payment_reconciliation: '*/10 * * * *',
    monthly_slot_reset: '5 0 1 * *',
    expire_user_plans: '0 1 * * *',
    database_backup_job: env.BACKUP_CRON_SCHEDULE,
    location_analytics_refresh: '0 2 * * *',
    notification_scheduler_poll: '* * * * *',
    cleanup_read_notifications: '0 * * * *',
    s3_garbage_collector_job: '0 2 * * *',
    admin_metrics_cache_job: '0 1 * * *',
    home_feed_warmup: '* * * * *',
    quality_score_backfill_job: '*/5 * * * *',
};

const parseRedisConnection = () => {
    if (env.REDIS_URL) {
        const parsedUrl = new URL(env.REDIS_URL);
        const dbFromPath = Number(parsedUrl.pathname.replace('/', '') || '0');
        return {
            host: parsedUrl.hostname || 'localhost',
            port: Number(parsedUrl.port || '6379'),
            password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
            db: Number.isFinite(dbFromPath) ? dbFromPath : env.REDIS_DB,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            tls: undefined, // 🔒 FORCE DISABLE TLS
        };
    }

    return {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: undefined, // 🔒 FORCE DISABLE TLS
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
    : new Queue<TraceableJobData, unknown, string>('scheduler-jobs', {
        connection: schedulerQueueConnection,
        defaultJobOptions: schedulerDefaultJobOptions,
    });

let processorsRegistered = false;
let schedulerWorker: Worker<TraceableJobData, unknown, string> | null = null;
let schedulerQueueEvents: QueueEvents | null = null;

export const registerSchedulerJobProcessors = async (
    processors: Record<SchedulerJobName, SchedulerProcessor>
) => {
    if (shouldDisableSchedulerQueue || processorsRegistered) return;
    processorsRegistered = true;

    const processor: Processor<TraceableJobData, unknown, string> = async (job) => {
        const handler = processors[job.name as SchedulerJobName];
        if (!handler) {
            throw new Error(`No scheduler processor registered for job ${job.name}`);
        }
        return handler(job as Job<TraceableJobData>);
    };

    schedulerWorker = registerWorkerWithTrace<TraceableJobData>('scheduler-jobs', processor, {
        connection: schedulerQueueConnection,
        concurrency: 1,
    });

    schedulerQueueEvents = new QueueEvents('scheduler-jobs', {
        connection: schedulerQueueConnection,
    });

    schedulerQueueEvents.on('completed', ({ jobId }) => {
        logger.info('Scheduler queue job completed', { jobId });
    });

    await Promise.all([
        schedulerWorker?.waitUntilReady(), 
        schedulerQueueEvents?.waitUntilReady()
    ].filter(Boolean));
};


export const registerSchedulerRepeatableJobs = async () => {
    if (shouldDisableSchedulerQueue || !schedulerQueue) return;

    const timezone = env.TZ;
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
