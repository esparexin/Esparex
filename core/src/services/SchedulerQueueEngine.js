"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopSchedulerQueueEngine = exports.startSchedulerQueueEngine = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const schedulerQueue_1 = require("@core/queues/schedulerQueue");
const expireAds_job_1 = require("../jobs/expireAds.job");
const suspendExpiredBusinesses_job_1 = require("../jobs/suspendExpiredBusinesses.job");
const notifyBusiness_job_1 = require("../jobs/notifyBusiness.job");
const reconcilePayments_job_1 = require("../jobs/reconcilePayments.job");
const resetMonthlySlots_job_1 = require("../jobs/resetMonthlySlots.job");
const expireUserPlans_job_1 = require("../jobs/expireUserPlans.job");
const backup_job_1 = require("../jobs/backup.job");
const locationAnalyticsWorker_1 = require("../workers/locationAnalyticsWorker");
const SchedulerService_1 = require("./SchedulerService");
const s3GarbageCollector_job_1 = require("../jobs/s3GarbageCollector.job");
const adminMetrics_job_1 = require("../jobs/adminMetrics.job");
const homeFeedWarmup_job_1 = require("../jobs/homeFeedWarmup.job");
const QualityScoreBackfillWorker_1 = require("../workers/QualityScoreBackfillWorker");
const cleanupReadNotifications_job_1 = require("../jobs/cleanupReadNotifications.job");
const schedulerProcessors = {
    expire_ads_job: expireAds_job_1.runExpireAdsJob,
    suspend_expired_businesses: suspendExpiredBusinesses_job_1.runSuspendExpiredBusinessesJob,
    notify_business_expiry: notifyBusiness_job_1.runNotifyBusinessJob,
    payment_reconciliation: reconcilePayments_job_1.runPaymentReconciliationJob,
    monthly_slot_reset: resetMonthlySlots_job_1.runMonthlySlotResetJob,
    expire_user_plans: expireUserPlans_job_1.runExpireUserPlansJob,
    database_backup_job: backup_job_1.runBackupJob,
    location_analytics_refresh: locationAnalyticsWorker_1.runLocationAnalyticsJob,
    notification_scheduler_poll: SchedulerService_1.runScheduledNotificationPoll,
    cleanup_read_notifications: cleanupReadNotifications_job_1.runCleanupReadNotificationsJob,
    s3_garbage_collector_job: s3GarbageCollector_job_1.runS3GarbageCollectorJob,
    admin_metrics_cache_job: adminMetrics_job_1.runAdminMetricsJob,
    home_feed_warmup: homeFeedWarmup_job_1.runHomeFeedWarmupJob,
    quality_score_backfill_job: QualityScoreBackfillWorker_1.runQualityScoreBackfill,
};
let schedulerQueueEngineStarted = false;
const startSchedulerQueueEngine = async () => {
    if (schedulerQueueEngineStarted)
        return;
    await (0, schedulerQueue_1.registerSchedulerJobProcessors)(Object.fromEntries(Object.entries(schedulerProcessors).map(([jobName, run]) => [
        jobName,
        async (job) => {
            void job;
            return run();
        },
    ])));
    await (0, schedulerQueue_1.registerSchedulerRepeatableJobs)();
    schedulerQueueEngineStarted = true;
    logger_1.default.info('Scheduler queue engine started');
};
exports.startSchedulerQueueEngine = startSchedulerQueueEngine;
const stopSchedulerQueueEngine = async () => {
    await (0, schedulerQueue_1.closeSchedulerQueue)();
    schedulerQueueEngineStarted = false;
};
exports.stopSchedulerQueueEngine = stopSchedulerQueueEngine;
exports.default = exports.startSchedulerQueueEngine;
//# sourceMappingURL=SchedulerQueueEngine.js.map