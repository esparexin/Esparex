import logger from '../utils/logger';
import type { Job } from 'bullmq';
import {
    closeSchedulerQueue,
    registerSchedulerJobProcessors,
    registerSchedulerRepeatableJobs,
    type SchedulerJobName
} from '../queues/schedulerQueue';
import { runExpireAdsJob } from '../jobs/expireAds.job';
import { runSuspendExpiredBusinessesJob } from '../jobs/suspendExpiredBusinesses.job';
import { runNotifyBusinessJob } from '../jobs/notifyBusiness.job';
import { runPaymentReconciliationJob } from '../jobs/reconcilePayments.job';
import { runMonthlySlotResetJob } from '../jobs/resetMonthlySlots.job';
import { runBackupJob } from '../jobs/backup.job';
import { runLocationAnalyticsJob } from '../workers/locationAnalyticsWorker';
import { runScheduledNotificationPoll } from './SchedulerService';
import { runS3GarbageCollectorJob } from '../jobs/s3GarbageCollector.job';
import { runAdminMetricsJob } from '../jobs/adminMetrics.job';
import { runHomeFeedWarmupJob } from '../jobs/homeFeedWarmup.job';
import { runQualityScoreBackfill } from '../workers/QualityScoreBackfillWorker';

const schedulerProcessors: Record<SchedulerJobName, () => Promise<unknown>> = {
    expire_ads_job: runExpireAdsJob,
    suspend_expired_businesses: runSuspendExpiredBusinessesJob,
    notify_business_expiry: runNotifyBusinessJob,
    payment_reconciliation: runPaymentReconciliationJob,
    monthly_slot_reset: runMonthlySlotResetJob,
    database_backup_job: runBackupJob,
    location_analytics_refresh: runLocationAnalyticsJob,
    notification_scheduler_poll: runScheduledNotificationPoll,
    s3_garbage_collector_job: runS3GarbageCollectorJob,
    admin_metrics_cache_job: runAdminMetricsJob,
    home_feed_warmup: runHomeFeedWarmupJob,
    quality_score_backfill_job: runQualityScoreBackfill,
};

let schedulerQueueEngineStarted = false;

export const startSchedulerQueueEngine = async () => {
    if (schedulerQueueEngineStarted) return;

    await registerSchedulerJobProcessors(
        Object.fromEntries(
            Object.entries(schedulerProcessors).map(([jobName, run]) => [
                jobName,
                async (job: Job) => {
                    void job;
                    return run();
                },
            ])
        ) as Record<SchedulerJobName, (job: Job) => Promise<unknown>>
    );

    await registerSchedulerRepeatableJobs();
    schedulerQueueEngineStarted = true;
    logger.info('Scheduler queue engine started');
};

export const stopSchedulerQueueEngine = async () => {
    await closeSchedulerQueue();
    schedulerQueueEngineStarted = false;
};

export default startSchedulerQueueEngine;
