import type { Types } from "mongoose";

import ScheduledNotification from "../models/ScheduledNotification";
import NotificationLog from "../models/NotificationLog";
import { NOTIFICATION_TYPE } from "../../../shared/enums/notificationType";
import { NotificationIntent } from "../domain/NotificationIntent";
import { NotificationDispatcher } from "./notification/NotificationDispatcher";
import logger from "../utils/logger";
import { runWithDistributedJobLock } from "../utils/distributedJobLock";
import { createAdminNotificationTargetCursor } from "./notification/AdminNotificationTargetingService";

interface ScheduledJobLike {
    _id: unknown;
    title: string;
    body: string;
    targetType: "topic" | "all" | "users";
    targetValue?: string;
    userIds?: Array<string | Types.ObjectId>;
    actionUrl?: string;
    sentBy: Types.ObjectId;
    status: "pending" | "sent" | "failed" | "cancelled";
    save: () => Promise<unknown>;
}

const BATCH_SIZE = 500;

export const runScheduledNotificationPoll = async () => {
    await runWithDistributedJobLock(
        "notification_scheduler_poll",
        { ttlMs: 4 * 60 * 1000, failOpen: false },
        async () => {
            try {
                const now = new Date();
                const pendingJobs = await ScheduledNotification.find({
                    status: "pending",
                    sendAt: { $lte: now },
                });

                if (pendingJobs.length > 0) {
                    logger.info("Processing scheduled notifications", { count: pendingJobs.length });

                    for (const job of pendingJobs) {
                        await processJob(job);
                    }
                }
            } catch (error) {
                logger.error("Scheduler error", { error: error instanceof Error ? error.message : String(error) });
            }
        }
    );
};

const processJob = async (job: ScheduledJobLike) => {
    try {
        let successCount = 0;
        let skippedCount = 0;
        let failureCount = 0;
        const jobId = String(job._id);

        if (job.targetType === "users") {
            const intents = (job.userIds ?? []).map((uid) =>
                NotificationIntent.fromSchedulerJob(String(uid), jobId, job.title, job.body, job.targetType, job.actionUrl)
            );
            const result = await NotificationDispatcher.bulkDispatch(intents);
            successCount += result.successCount;
            skippedCount += result.skippedCount;
            failureCount += result.failureCount;
        } else {
            const cursor = createAdminNotificationTargetCursor({
                targetType: job.targetType,
                targetValue: job.targetValue,
            });

            let batch: NotificationIntent[] = [];

            for await (const user of cursor) {
                batch.push(
                    NotificationIntent.fromSchedulerJob(
                        user._id.toString(),
                        jobId,
                        job.title,
                        job.body,
                        job.targetType,
                        job.actionUrl
                    )
                );

                if (batch.length >= BATCH_SIZE) {
                    const result = await NotificationDispatcher.bulkDispatch(batch);
                    successCount += result.successCount;
                    skippedCount += result.skippedCount;
                    failureCount += result.failureCount;
                    batch = [];
                }
            }

            if (batch.length > 0) {
                const result = await NotificationDispatcher.bulkDispatch(batch);
                successCount += result.successCount;
                skippedCount += result.skippedCount;
                failureCount += result.failureCount;
            }
        }

        job.status = successCount > 0 || skippedCount > 0 ? "sent" : "failed";
        await job.save();

        await NotificationLog.create({
            title: job.title,
            body: job.body,
            type: NOTIFICATION_TYPE.SYSTEM,
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
    } catch (error) {
        logger.error("Job processing failed", {
            jobId: job._id,
            error: error instanceof Error ? error.message : String(error),
        });
        job.status = "failed";
        await job.save();
    }
};
