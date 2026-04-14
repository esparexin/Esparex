import { Request, Response } from "express";
import mongoose from "mongoose";

import { NOTIFICATION_TYPE } from "../../../../shared/enums/notificationType";
import { NotificationIntent } from "../../domain/NotificationIntent";
import {
    createNotificationLog,
    createScheduledNotification,
    getNotificationHistory,
    searchNotificationRecipients,
} from "../../services/AdminNotificationService";
import {
    getPaginationParams,
    sendAdminError,
    sendSuccessResponse,
} from "./adminBaseController";
import { logAdminAction } from "../../utils/adminLogger";
import { NotificationDispatcher } from "../../services/notification/NotificationDispatcher";
import { createAdminNotificationTargetCursor } from "../../services/notification/AdminNotificationTargetingService";
import { type IUser } from "../../models/User";
import { respond } from "../../utils/respond";

const BATCH_SIZE = 500;

type AdminNotificationTargetType = "all" | "topic" | "users";

type HistoryRecord = {
    id: string;
    title: string;
    body: string;
    type: string;
    targetType: AdminNotificationTargetType;
    targetValue?: string;
    userIds?: Array<string | mongoose.Types.ObjectId>;
    actionUrl?: string;
    sentBy: mongoose.Types.ObjectId | Record<string, unknown> | null;
    successCount: number;
    skippedCount: number;
    failureCount: number;
    status: "sent" | "failed" | "scheduled";
    createdAt: Date;
    sendAt?: Date;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function dispatchToAudience(params: {
    audienceId: string;
    title: string;
    body: string;
    targetType: AdminNotificationTargetType;
    targetValue?: string;
    userIds?: string[];
    actionUrl?: string;
    kind: string;
}) {
    const cursor = createAdminNotificationTargetCursor({
        targetType: params.targetType,
        targetValue: params.targetValue,
        userIds: params.userIds,
    });

    let successCount = 0;
    let skippedCount = 0;
    let failureCount = 0;
    let batch: NotificationIntent[] = [];

    for await (const user of cursor) {
        batch.push(
            NotificationIntent.fromAdminBroadcast(
                user._id.toString(),
                params.audienceId,
                params.title,
                params.body,
                params.kind,
                params.targetType,
                params.actionUrl
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

    return { successCount, skippedCount, failureCount };
}

export async function sendNotification(req: Request, res: Response) {
    try {
        const currentUser = req.user as unknown as IUser;
        const { title, body, targetType, targetValue, userIds, actionUrl, sendAt } = req.body as {
            title: string;
            body: string;
            targetType: AdminNotificationTargetType;
            targetValue?: string;
            userIds?: string[];
            actionUrl?: string;
            sendAt?: string;
        };

        if (sendAt) {
            const scheduledAt = new Date(sendAt);
            if (Number.isNaN(scheduledAt.getTime())) {
                return sendAdminError(req, res, "Invalid scheduled time", 400);
            }
            if (scheduledAt <= new Date()) {
                return sendAdminError(req, res, "Scheduled time must be in the future", 400);
            }

            const scheduled = await createScheduledNotification({
                title,
                body,
                type: NOTIFICATION_TYPE.SYSTEM,
                targetType,
                targetValue,
                userIds: targetType === "users" ? userIds : undefined,
                actionUrl,
                sentBy: currentUser._id,
                sendAt: scheduledAt,
                status: "pending",
            });

            await logAdminAction(req, "SCHEDULE_NOTIFICATION", "ScheduledNotification", scheduled._id.toString(), {
                title,
                targetType,
                targetValue,
                actionUrl,
                sendAt: scheduledAt.toISOString(),
            });

            return sendSuccessResponse(res, scheduled, `Notification scheduled for ${scheduledAt.toLocaleString()}`);
        }

        const audienceId = new mongoose.Types.ObjectId().toString();
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
        const log = await createNotificationLog({
            title,
            body,
            type: NOTIFICATION_TYPE.SYSTEM,
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

        await logAdminAction(req, "SEND_NOTIFICATION", "Notification", log._id.toString(), {
            title,
            targetType,
            targetValue,
            successCount,
            skippedCount,
            failureCount,
            actionUrl,
        });

        return sendSuccessResponse(res, log, status === "sent" ? "Notification sent successfully" : "Notification failed");
    } catch (error) {
        return sendAdminError(req, res, error);
    }
}

export async function getHistory(req: Request, res: Response) {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const { q, status, targetType } = req.query as {
            q?: string;
            status?: "all" | "sent" | "failed" | "scheduled";
            targetType?: AdminNotificationTargetType;
        };
        const historyStatus = status ?? "all";
        const mergeWindow = skip + limit;
        const searchTerm = q?.trim();
        const searchRegex = searchTerm ? new RegExp(escapeRegex(searchTerm), "i") : null;

        const logMatch: {
            targetType?: AdminNotificationTargetType;
            status?: "sent" | "failed";
            $or?: Array<
                | { title: { $regex: RegExp } }
                | { body: { $regex: RegExp } }
            >;
        } = {};

        const scheduledMatch: {
            targetType?: AdminNotificationTargetType;
            status: "pending";
            $or?: Array<
                | { title: { $regex: RegExp } }
                | { body: { $regex: RegExp } }
            >;
        } = {
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

        const { logs, logsTotal, scheduled, scheduledTotal } = await getNotificationHistory(
            logMatch as Record<string, unknown>,
            scheduledMatch,
            { includeLogs, includeScheduled, mergeWindow }
        );

        const normalizedLogs: HistoryRecord[] = logs.map((log) => ({
            id: log._id.toString(),
            title: log.title,
            body: log.body,
            type: log.type,
            targetType: log.targetType,
            targetValue: log.targetValue,
            userIds: log.userIds,
            actionUrl: log.actionUrl,
            sentBy: (log as unknown as { sentBy?: mongoose.Types.ObjectId | Record<string, unknown> }).sentBy ?? null,
            successCount: log.successCount,
            skippedCount: log.skippedCount ?? 0,
            failureCount: log.failureCount,
            status: log.status,
            createdAt: log.createdAt,
        }));

        const normalizedScheduled: HistoryRecord[] = scheduled.map((job) => ({
            id: job._id.toString(),
            title: job.title,
            body: job.body,
            type: job.type,
            targetType: job.targetType,
            targetValue: job.targetValue,
            userIds: job.userIds,
            actionUrl: job.actionUrl,
            sentBy: (job as unknown as { sentBy?: mongoose.Types.ObjectId | Record<string, unknown> }).sentBy ?? null,
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

        return res.status(200).json(
            respond({
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
            })
        );
    } catch (error) {
        return sendAdminError(req, res, error);
    }
}

export async function getRecipients(req: Request, res: Response) {
    try {
        const { q, limit = 8 } = req.query as { q?: string; limit?: number };
        const query = q?.trim();

        if (!query) {
            return sendSuccessResponse(res, { items: [] });
        }

        const items = await searchNotificationRecipients(query, typeof limit === 'number' ? limit : Number(limit) || 8);

        return sendSuccessResponse(res, { items });
    } catch (error) {
        return sendAdminError(req, res, error);
    }
}
