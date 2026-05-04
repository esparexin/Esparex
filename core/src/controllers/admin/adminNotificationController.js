"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.getHistory = getHistory;
exports.getRecipients = getRecipients;
const mongoose_1 = __importDefault(require("mongoose"));
const notificationType_1 = require("@esparex/shared/enums/notificationType");
const NotificationIntent_1 = require("@esparex/core/domain/NotificationIntent");
const AdminNotificationService_1 = require("@esparex/core/services/AdminNotificationService");
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
const NotificationDispatcher_1 = require("@esparex/core/services/notification/NotificationDispatcher");
const AdminNotificationTargetingService_1 = require("@esparex/core/services/notification/AdminNotificationTargetingService");
const respond_1 = require("@esparex/core/utils/respond");
const BATCH_SIZE = 500;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
async function dispatchToAudience(params) {
    const cursor = (0, AdminNotificationTargetingService_1.createAdminNotificationTargetCursor)({
        targetType: params.targetType,
        targetValue: params.targetValue,
        userIds: params.userIds,
    });
    let successCount = 0;
    let skippedCount = 0;
    let failureCount = 0;
    let batch = [];
    for await (const user of cursor) {
        batch.push(NotificationIntent_1.NotificationIntent.fromAdminBroadcast(user._id.toString(), params.audienceId, params.title, params.body, params.kind, params.targetType, params.actionUrl));
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
    return { successCount, skippedCount, failureCount };
}
async function sendNotification(req, res) {
    try {
        const currentUser = req.user;
        const { title, body, targetType, targetValue, userIds, actionUrl, sendAt } = req.body;
        if (sendAt) {
            const scheduledAt = new Date(sendAt);
            if (Number.isNaN(scheduledAt.getTime())) {
                return (0, adminBaseController_1.sendAdminError)(req, res, "Invalid scheduled time", 400);
            }
            if (scheduledAt <= new Date()) {
                return (0, adminBaseController_1.sendAdminError)(req, res, "Scheduled time must be in the future", 400);
            }
            const scheduled = await (0, AdminNotificationService_1.createScheduledNotification)({
                title,
                body,
                type: notificationType_1.NOTIFICATION_TYPE.SYSTEM,
                targetType,
                targetValue,
                userIds: targetType === "users" ? userIds : undefined,
                actionUrl,
                sentBy: currentUser._id,
                sendAt: scheduledAt,
                status: "pending",
            });
            await (0, adminLogger_1.logAdminAction)(req, "SCHEDULE_NOTIFICATION", "ScheduledNotification", scheduled._id.toString(), {
                title,
                targetType,
                targetValue,
                actionUrl,
                sendAt: scheduledAt.toISOString(),
            });
            return (0, adminBaseController_1.sendSuccessResponse)(res, scheduled, `Notification scheduled for ${scheduledAt.toLocaleString()}`);
        }
        const audienceId = new mongoose_1.default.Types.ObjectId().toString();
        const { successCount, skippedCount, failureCount } = await dispatchToAudience({
            audienceId,
            title,
            body,
            targetType,
            targetValue,
            userIds,
            actionUrl,
            kind: "admin_broadcast",
        });
        const status = successCount > 0 || skippedCount > 0 ? "sent" : "failed";
        const log = await (0, AdminNotificationService_1.createNotificationLog)({
            title,
            body,
            type: notificationType_1.NOTIFICATION_TYPE.SYSTEM,
            targetType,
            targetValue,
            userIds: targetType === "users" ? userIds : undefined,
            actionUrl,
            sentBy: currentUser._id,
            successCount,
            skippedCount,
            failureCount,
            status,
        });
        await (0, adminLogger_1.logAdminAction)(req, "SEND_NOTIFICATION", "Notification", log._id.toString(), {
            title,
            targetType,
            targetValue,
            successCount,
            skippedCount,
            failureCount,
            actionUrl,
        });
        return (0, adminBaseController_1.sendSuccessResponse)(res, log, status === "sent" ? "Notification sent successfully" : "Notification failed");
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
}
async function getHistory(req, res) {
    try {
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const { q, status, targetType } = req.query;
        const historyStatus = status ?? "all";
        const mergeWindow = skip + limit;
        const searchTerm = q?.trim();
        const searchRegex = searchTerm ? new RegExp(escapeRegex(searchTerm), "i") : null;
        const logMatch = {};
        const scheduledMatch = {
            status: "pending",
        };
        if (targetType) {
            logMatch.targetType = targetType;
            scheduledMatch.targetType = targetType;
        }
        if (searchRegex) {
            logMatch.$or = [{ title: { $regex: searchRegex } }, { body: { $regex: searchRegex } }];
            scheduledMatch.$or = [{ title: { $regex: searchRegex } }, { body: { $regex: searchRegex } }];
        }
        if (historyStatus === "sent" || historyStatus === "failed") {
            logMatch.status = historyStatus;
        }
        const includeLogs = historyStatus === "all" || historyStatus === "sent" || historyStatus === "failed";
        const includeScheduled = historyStatus === "all" || historyStatus === "scheduled";
        const { logs, logsTotal, scheduled, scheduledTotal } = await (0, AdminNotificationService_1.getNotificationHistory)(logMatch, scheduledMatch, { includeLogs, includeScheduled, mergeWindow });
        const normalizedLogs = logs.map((log) => ({
            id: log._id.toString(),
            title: log.title,
            body: log.body,
            type: log.type,
            targetType: log.targetType,
            targetValue: log.targetValue,
            userIds: log.userIds,
            actionUrl: log.actionUrl,
            sentBy: log.sentBy ?? null,
            successCount: log.successCount,
            skippedCount: log.skippedCount ?? 0,
            failureCount: log.failureCount,
            status: log.status,
            createdAt: log.createdAt,
        }));
        const normalizedScheduled = scheduled.map((job) => ({
            id: job._id.toString(),
            title: job.title,
            body: job.body,
            type: job.type,
            targetType: job.targetType,
            targetValue: job.targetValue,
            userIds: job.userIds,
            actionUrl: job.actionUrl,
            sentBy: job.sentBy ?? null,
            successCount: 0,
            skippedCount: 0,
            failureCount: 0,
            status: "scheduled",
            createdAt: job.sendAt,
            sendAt: job.sendAt,
        }));
        const items = [...normalizedScheduled, ...normalizedLogs]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(skip, skip + limit);
        const total = logsTotal + scheduledTotal;
        return res.status(200).json((0, respond_1.respond)({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        }));
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
}
async function getRecipients(req, res) {
    try {
        const { q, limit = 8 } = req.query;
        const query = q?.trim();
        if (!query) {
            return (0, adminBaseController_1.sendSuccessResponse)(res, { items: [] });
        }
        const items = await (0, AdminNotificationService_1.searchNotificationRecipients)(query, typeof limit === 'number' ? limit : Number(limit) || 8);
        return (0, adminBaseController_1.sendSuccessResponse)(res, { items });
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
}
//# sourceMappingURL=adminNotificationController.js.map