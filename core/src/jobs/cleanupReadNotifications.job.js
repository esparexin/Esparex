"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCleanupReadNotificationsJob = void 0;
const jobRunner_1 = require("@core/utils/jobRunner");
const logger_1 = __importDefault(require("@core/utils/logger"));
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const NotificationRetentionService_1 = require("@core/services/notification/NotificationRetentionService");
const runCleanupReadNotificationsJob = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)("cleanup_read_notifications", { ttlMs: 30 * 60 * 1000, failOpen: false }, async () => {
        await (0, jobRunner_1.jobRunner)("CleanupReadNotifications", async () => {
            const result = await (0, NotificationRetentionService_1.purgeExpiredReadNotifications)();
            logger_1.default.info("Cleanup Read Notifications Job completed", {
                deletedCount: result.deletedCount,
                cutoff: result.cutoff.toISOString(),
                retentionHours: result.retentionHours,
            });
            return result;
        });
    });
};
exports.runCleanupReadNotificationsJob = runCleanupReadNotificationsJob;
//# sourceMappingURL=cleanupReadNotifications.job.js.map