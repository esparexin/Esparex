import logger from '../../utils/logger';
import { Request, Response } from 'express';
import NotificationLog from '../../models/NotificationLog';
import Broadcast from '../../models/Broadcast';
import { NotificationIntent } from '../../domain/NotificationIntent';
import { NotificationDispatcher } from '../../services/notification/NotificationDispatcher';
import mongoose from 'mongoose';
import User, { IUser } from '../../models/User';
import { sendSuccessResponse, checkPermission, getPaginationParams, sendPaginatedResponse } from './adminBaseController';
import { logAdminAction } from '../../utils/adminLogger';
import { validateNotificationContent, validateAdminNotificationTarget } from '../../validators/notificationValidators';
import { sendErrorResponse } from '../../utils/errorResponse';


const sendAdminNotificationError = (req: Request, res: Response, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Admin notification operation failed';
    sendErrorResponse(req, res, 500, message);
};

/**
 * Send Admin Notification
 * POST /api/v1/admin/notifications/send
 * Body: { title, body, targetType: 'all' | 'users' | 'topic', targetValue?, userIds? }
 */
export const sendNotification = [
    validateNotificationContent,
    validateAdminNotificationTarget,
    async (req: Request, res: Response) => {
        try {
            const currentUser = req.user as unknown as IUser;
            if (!checkPermission(currentUser, 'notifications', 'update') && !checkPermission(currentUser, 'settings', 'update')) {
                return sendErrorResponse(req, res, 403, 'Permission denied: notifications:update required');
            }

            const { title, body, targetType, targetValue, userIds, sendAt } = req.body;

            if (!title || !body || !targetType) {
                return sendErrorResponse(req, res, 400, "Missing required fields");
            }

            // 0. Handle Scheduling
            if (sendAt) {
                const date = new Date(sendAt);
                if (date <= new Date()) {
                    return sendErrorResponse(req, res, 400, "Scheduled time must be in the future");
                }

                // Create scheduled notification record.
                // The BullMQ scheduler (schedulerService.ts) polls every minute and dispatches it at sendAt.
                const scheduled = await import('../../models/ScheduledNotification').then(m => m.default.create({
                    title,
                    body,
                    type: 'admin_push',
                    targetType,
                    targetValue: targetType === 'topic' ? targetValue : (targetType === 'all' ? 'all_users' : undefined),
                    userIds: targetType === 'users' ? userIds : undefined,
                    sentBy: currentUser._id,
                    sendAt: date,
                    status: 'pending'
                }));

                await logAdminAction(req, 'SCHEDULE_NOTIFICATION', 'ScheduledNotification', scheduled._id.toString(), { title, targetType });
                return sendSuccessResponse(res, scheduled, `Notification scheduled for ${date.toLocaleString()}`);
            }

            let successCount = 0;
            let failureCount = 0;

            const broadcastId = new mongoose.Types.ObjectId().toString();

            // 1. Topic / Broadcast
            if (targetType === 'topic' || targetType === 'all') {
                const cursor = User.find({}).select('_id').cursor();
                let batch: NotificationIntent[] = [];
                for await (const user of cursor) {
                    batch.push(NotificationIntent.fromAdminBroadcast(user._id.toString(), broadcastId, title, body, 'admin_push'));
                    if (batch.length >= 500) {
                        await NotificationDispatcher.bulkDispatch(batch);
                        successCount += batch.length;
                        batch = [];
                    }
                }
                if (batch.length > 0) {
                    await NotificationDispatcher.bulkDispatch(batch);
                    successCount += batch.length;
                }
            }
            // 2. Specific Users
            else if (targetType === 'users') {
                if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                    return sendErrorResponse(req, res, 400, "User IDs required");
                }

                const intents = userIds.map((uid: string) => 
                    NotificationIntent.fromAdminBroadcast(uid, broadcastId, title, body, 'admin_push')
                );

                await NotificationDispatcher.bulkDispatch(intents);
                successCount += intents.length;
            }

            // 3. Save Log
            const log = await NotificationLog.create({
                title,
                body,
                type: 'admin_push',
                targetType,
                targetValue: targetType === 'topic' ? targetValue : (targetType === 'all' ? 'all_users' : undefined),
                userIds: targetType === 'users' ? userIds : undefined,
                sentBy: currentUser._id,
                successCount,
                failureCount,
                status: 'sent'
            });

            await logAdminAction(req, 'SEND_NOTIFICATION', 'Notification', log._id.toString(), { title, successCount, failureCount });

            sendSuccessResponse(res, log, "Notification sent successfully");
        } catch (error) {
            sendAdminNotificationError(req, res, error);
        }
    }
];

/**
 * Get Notification History
 * GET /api/v1/admin/notifications/history
 */
export const getHistory = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user as unknown as IUser;
        if (!checkPermission(currentUser, 'notifications', 'read') && !checkPermission(currentUser, 'reports', 'read')) {
            return sendErrorResponse(req, res, 403, 'Permission denied: notifications:read or reports:read required');
        }

        const { page, limit, skip } = getPaginationParams(req);

        const [logs, total] = await Promise.all([
            NotificationLog.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('sentBy', 'firstName lastName email'), // Populate admin info
            NotificationLog.countDocuments()
        ]);

        sendPaginatedResponse(res, logs, total, page, limit);
    } catch (error) {
        sendAdminNotificationError(req, res, error);
    }
};

/**
 * Create admin broadcast
 * POST /api/v1/admin/broadcast
 * Body: { type: 'GLOBAL' | 'SEGMENT' | 'USER', title, message, targetUsers?, segment? }
 */
export const createBroadcast = async (req: Request, res: Response) => {
    try {
        const adminUser = req.user as unknown as IUser;
        const type = typeof req.body?.type === 'string' ? req.body.type.toUpperCase() : '';
        const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
        const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
        const targetUsers = Array.isArray(req.body?.targetUsers)
            ? req.body.targetUsers.filter((userId: unknown) => typeof userId === 'string')
            : [];
        const segment = typeof req.body?.segment === 'string' ? req.body.segment.trim() : '';

        if (!['GLOBAL', 'SEGMENT', 'USER'].includes(type)) {
            return sendErrorResponse(req, res, 400, 'Invalid broadcast type');
        }
        if (!title || !message) {
            return sendErrorResponse(req, res, 400, 'title and message are required');
        }
        if (type === 'USER' && targetUsers.length === 0) {
            return sendErrorResponse(req, res, 400, 'targetUsers are required for USER broadcast');
        }
        if (type === 'SEGMENT' && !segment) {
            return sendErrorResponse(req, res, 400, 'segment is required for SEGMENT broadcast');
        }

        const broadcast = await Broadcast.create({
            type,
            title,
            message,
            targetUsers: type === 'USER' ? targetUsers : [],
            metadata: type === 'SEGMENT' ? { segment } : undefined,
            createdBy: adminUser._id
        });

        let successCount = 0;
        let failureCount = 0;
        const broadcastIdText = broadcast._id.toString();

        if (type === 'GLOBAL' || type === 'SEGMENT') {
            const cursor = User.find({}).select('_id').cursor();
            let batch: NotificationIntent[] = [];
            for await (const user of cursor) {
                batch.push(NotificationIntent.fromAdminBroadcast(user._id.toString(), broadcastIdText, title, message, 'admin_broadcast'));
                if (batch.length >= 500) {
                    await NotificationDispatcher.bulkDispatch(batch);
                    successCount += batch.length;
                    batch = [];
                }
            }
            if (batch.length > 0) {
                await NotificationDispatcher.bulkDispatch(batch);
                successCount += batch.length;
            }
        } else {
            const intents = targetUsers.map((uid: string) => 
                NotificationIntent.fromAdminBroadcast(uid, broadcastIdText, title, message, 'admin_broadcast')
            );
            await NotificationDispatcher.bulkDispatch(intents);
            successCount += intents.length;
        }

        await logAdminAction(req, 'CREATE_BROADCAST', 'Notification', broadcast._id.toString(), {
            type,
            successCount,
            failureCount,
            segment: segment || undefined,
            targets: targetUsers.length
        });

        return sendSuccessResponse(res, {
            ...broadcast.toJSON(),
            delivery: {
                successCount,
                failureCount
            }
        }, 'Broadcast created');
    } catch (error) {
        return sendAdminNotificationError(req, res, error);
    }
};
