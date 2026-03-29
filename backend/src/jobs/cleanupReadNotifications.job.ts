import { jobRunner } from "../utils/jobRunner";
import logger from "../utils/logger";
import { runWithDistributedJobLock } from "../utils/distributedJobLock";
import { purgeExpiredReadNotifications } from "../services/notification/NotificationRetentionService";

export const runCleanupReadNotificationsJob = async () => {
    await runWithDistributedJobLock(
        "cleanup_read_notifications",
        { ttlMs: 30 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner("CleanupReadNotifications", async () => {
                const result = await purgeExpiredReadNotifications();

                logger.info("Cleanup Read Notifications Job completed", {
                    deletedCount: result.deletedCount,
                    cutoff: result.cutoff.toISOString(),
                    retentionHours: result.retentionHours,
                });

                return result;
            });
        }
    );
};
