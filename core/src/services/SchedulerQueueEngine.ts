import logger from '../utils/logger';
import type { Job } from 'bullmq';
import {
    closeSchedulerQueue,
    registerSchedulerJobProcessors,
    registerSchedulerRepeatableJobs,
    type SchedulerJobName
} from '../queues/schedulerQueue';
import { runExpireAdsJob } from '../jobs/expireAds.job';
import { runExpireBusinessesJob } from '../jobs/expireBusinesses.job';
import { runNotifyBusinessJob } from '../jobs/notifyBusiness.job';
import { runPaymentReconciliationJob } from '../jobs/reconcilePayments.job';
import { runMonthlySlotResetJob } from '../jobs/resetMonthlySlots.job';
import { runExpireUserPlansJob } from '../jobs/expireUserPlans.job';
import { runBackupJob } from '../jobs/backup.job';
import { runLocationAnalyticsJob } from '../workers/locationAnalyticsWorker';
import { runScheduledNotificationPoll } from './SchedulerService';
import { runS3GarbageCollectorJob } from '../jobs/s3GarbageCollector.job';
import { runAdminMetricsJob } from '../jobs/adminMetrics.job';
import { runHomeFeedWarmupJob } from '../jobs/homeFeedWarmup.job';
import { runQualityScoreBackfill } from '../workers/QualityScoreBackfillWorker';
import { runCleanupReadNotificationsJob } from '../jobs/cleanupReadNotifications.job';
import { runExpiryWarningJob } from '../jobs/expiryWarning.job';
import { runExpireSmartAlertsJob } from '../jobs/expireSmartAlerts.job';

const schedulerProcessors: Record<SchedulerJobName, () => Promise<unknown>> = {
    expire_ads_job: runExpireAdsJob,
    expire_businesses: runExpireBusinessesJob,
    notify_business_expiry: runNotifyBusinessJob,
    payment_reconciliation: runPaymentReconciliationJob,
    monthly_slot_reset: runMonthlySlotResetJob,
    expire_user_plans: runExpireUserPlansJob,
    database_backup_job: runBackupJob,
    location_analytics_refresh: runLocationAnalyticsJob,
    notification_scheduler_poll: runScheduledNotificationPoll,
    cleanup_read_notifications: runCleanupReadNotificationsJob,
    s3_garbage_collector_job: runS3GarbageCollectorJob,
    admin_metrics_cache_job: runAdminMetricsJob,
    home_feed_warmup: runHomeFeedWarmupJob,
    quality_score_backfill_job: runQualityScoreBackfill,
    proactive_expiry_warning: runExpiryWarningJob,
    expire_smart_alerts: runExpireSmartAlertsJob,
};

/**
 * Wraps a scheduler job runner with execution duration telemetry.
 * Logs jobName, durationMs, and outcome on every execution without
 * modifying retry logic or error propagation.
 */
const withJobTelemetry = (
    jobName: string,
    run: () => Promise<unknown>
): ((job: Job) => Promise<unknown>) => {
    return async (job: Job): Promise<unknown> => {
        void job;
        const startedAt = Date.now();
        try {
            const result = await run();
            const durationMs = Date.now() - startedAt;
            logger.info(`[Scheduler] Job completed`, {
                jobName,
                durationMs,
                outcome: 'success',
            });
            return result;
        } catch (error) {
            const durationMs = Date.now() - startedAt;
            logger.error(`[Scheduler] Job failed`, {
                jobName,
                durationMs,
                outcome: 'failure',
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    };
};

let schedulerQueueEngineStarted = false;

export const startSchedulerQueueEngine = async () => {
    if (schedulerQueueEngineStarted) return;

    await registerSchedulerJobProcessors(
        Object.fromEntries(
            Object.entries(schedulerProcessors).map(([jobName, run]) => [
                jobName,
                withJobTelemetry(jobName, run),
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
