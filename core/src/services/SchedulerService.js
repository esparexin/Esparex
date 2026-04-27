"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScheduledNotificationPoll = void 0;
const ScheduledNotification_1 = __importDefault(require("@core/models/ScheduledNotification"));
const NotificationLog_1 = __importDefault(require("@core/models/NotificationLog"));
const notificationType_1 = require("@core/constants/enums/notificationType");
const NotificationIntent_1 = require("../domain/NotificationIntent");
const NotificationDispatcher_1 = require("./notification/NotificationDispatcher");
const logger_1 = __importDefault(require("@core/utils/logger"));
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const AdminNotificationTargetingService_1 = require("./notification/AdminNotificationTargetingService");
const BATCH_SIZE = 500;
const runScheduledNotificationPoll = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)("notification_scheduler_poll", { ttlMs: 4 * 60 * 1000, failOpen: false }, async () => {
        try {
            const now = new Date();
            const pendingJobs = await ScheduledNotification_1.default.find({
                status: "pending",
                sendAt: { $lte: now },
            });
            if (pendingJobs.length > 0) {
                logger_1.default.info("Processing scheduled notifications", { count: pendingJobs.length });
                for (const job of pendingJobs) {
                    await processJob(job);
                }
            }
        }
        catch (error) {
            logger_1.default.error("Scheduler error", { error: error instanceof Error ? error.message : String(error) });
        }
    });
};
exports.runScheduledNotificationPoll = runScheduledNotificationPoll;
const processJob = async (job) => {
    try {
        let successCount = 0;
        let skippedCount = 0;
        let failureCount = 0;
        const jobId = String(job._id);
        if (job.targetType === "users") {
            const intents = (job.userIds ?? []).map((uid) => NotificationIntent_1.NotificationIntent.fromSchedulerJob(String(uid), jobId, job.title, job.body, job.targetType, job.actionUrl));
            const result = await NotificationDispatcher_1.NotificationDispatcher.bulkDispatch(intents);
            successCount += result.successCount;
            skippedCount += result.skippedCount;
            failureCount += result.failureCount;
        }
        else {
            const cursor = (0, AdminNotificationTargetingService_1.createAdminNotificationTargetCursor)({
                targetType: job.targetType,
                targetValue: job.targetValue,
            });
            let batch = [];
            for await (const user of cursor) {
                batch.push(NotificationIntent_1.NotificationIntent.fromSchedulerJob(user._id.toString(), jobId, job.title, job.body, job.targetType, job.actionUrl));
                if (batch.length >= BATCH_SIZE) {
                    const result = await NotificationDispatcher_1.NotificationDispatcher.bulkDispatch(batch);
                    successCount += result.successCount;
                    skippedCount += result.skippedCount;
                    failureCount += result.failureCount;
                    batch = [];
                }
            }
            if (batch.length > 0) {
                const result = await NotificationDispatcher_1.NotificationDispatcher.bulkDispatch(batch);
                successCount += result.successCount;
                skippedCount += result.skippedCount;
                failureCount += result.failureCount;
            }
        }
        job.status = successCount > 0 || skippedCount > 0 ? "sent" : "failed";
        await job.save();
        await NotificationLog_1.default.create({
            title: job.title,
            body: job.body,
            type: notificationType_1.NOTIFICATION_TYPE.SYSTEM,
            targetType: job.targetType,
            targetValue: job.targetValue,
            userIds: job.userIds,
            actionUrl: job.actionUrl,
            sentBy: job.sentBy,
            successCount,
            skippedCount,
            failureCount,
            status: job.status === "sent" ? "sent" : "failed",
            createdAt: new Date(),
        });
    }
    catch (error) {
        logger_1.default.error("Job processing failed", {
            jobId: job._id,
            error: error instanceof Error ? error.message : String(error),
        });
        job.status = "failed";
        await job.save();
    }
};
//# sourceMappingURL=SchedulerService.js.map