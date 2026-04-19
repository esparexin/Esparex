import Notification from '../models/Notification';
import logger from '../utils/logger';
import { NotificationTypeValue } from '@shared/enums/notificationType';
import { NotificationDispatcher } from './notification/NotificationDispatcher';
import { NotificationIntent } from '../domain/NotificationIntent';
import { getNotificationTemplate, type TemplateParams } from './notification/NotificationTemplateService';

export { registerToken, sendNotification } from './notification/PushGatewayService';


export const queryNotificationsForUser = async (
    query: Record<string, unknown>,
    userId: string,
    skip: number,
    limit: number
) => {
    // Single aggregation pass: replaces two separate countDocuments calls
    // (one for total, one for unreadCount) that previously ran in parallel.
    const [result] = await Notification.aggregate<{
        notifications: InstanceType<typeof Notification>[];
        total: { count: number }[];
        unreadCount: { count: number }[];
    }>([
        { $match: query },
        {
            $facet: {
                notifications: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                ],
                total: [{ $count: 'count' }],
                unreadCount: [
                    // userId is already scoped by the outer $match — re-casting
                    // Types.ObjectId(userId) here causes a MongoServerError when the
                    // serialized ObjectId in the facet cursor has a type mismatch.
                    { $match: { isRead: false } },
                    { $count: 'count' },
                ],
            },
        },
    ]);

    return {
        notifications: result?.notifications ?? [],
        total: result?.total?.[0]?.count ?? 0,
        unreadCount: result?.unreadCount?.[0]?.count ?? 0,
    };
};

/**
 * Create an In-App Notification (and optional FCM push).
 *
 * Thin wrapper around NotificationDispatcher so all writes go through
 * the single gateway: DB save → version increment → WebSocket emit → FCM.
 */
export const createInAppNotification = async (
    userId: string,
    type: NotificationTypeValue,
    title: string,
    message: string,
    data: Record<string, unknown> = {}
): Promise<void> => {
    try {
        const intent = new NotificationIntent({
            userId,
            type,
            entityRef: { domain: 'system', id: userId },
            message: { title, body: message, data },
            channels: ['in-app', 'push'],
            priority: 'medium',
        });
        await NotificationDispatcher.dispatch(intent);
    } catch (error) {
        logger.error('Failed to create in-app notification', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

/**
 * Higher-level helper to dispatch notifications using a template key.
 */
export const dispatchTemplatedNotification = async (
    userId: string,
    type: NotificationTypeValue,
    templateKey: string,
    params: TemplateParams = {},
    data: Record<string, unknown> = {}
): Promise<void> => {
    const { title, body } = getNotificationTemplate(templateKey, params);
    return createInAppNotification(userId, type, title, body, { ...params, ...data });
};


export const markAllNotificationsRead = async (userId: string): Promise<number> => {
    const result = await Notification.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
    );
    return result.modifiedCount;
};

export const markNotificationReadById = async (id: string, userId: string) => {
    return Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true, readAt: new Date() },
        { new: true }
    );
};

export const deleteUserNotification = async (id: string, userId: string) => {
    return Notification.findOneAndDelete({ _id: id, userId });
};
