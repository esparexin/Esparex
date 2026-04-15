import { Types } from 'mongoose';
import User from '../models/User';
import Notification from '../models/Notification';
import admin from '../config/firebaseAdmin';
import logger from '../utils/logger';
import { NotificationTypeValue } from '@shared/enums/notificationType';
import { NotificationDispatcher } from './notification/NotificationDispatcher';
import { NotificationIntent } from '../domain/NotificationIntent';
import { getSystemConfigDoc } from '../utils/systemConfigHelper';

interface TokenResponse {
    success: boolean;
    error?: { code?: string };
}

interface MulticastResponse {
    failureCount: number;
    responses: TokenResponse[];
}

interface MessagingService {
    subscribeToTopic: (token: string, topic: string) => Promise<unknown>;
    sendMulticast?: (message: {
        notification: { title: string; body: string };
        data: Record<string, string>;
        tokens: string[];
    }) => Promise<MulticastResponse>;
    sendEachForMulticast?: (message: {
        notification: { title: string; body: string };
        data: Record<string, string>;
        tokens: string[];
    }) => Promise<MulticastResponse>;
}

/**
 * Register a Device Token
 */
export const registerToken = async (userId: string, token: string, platform: 'web' | 'android' | 'ios' = 'web') => {
    // Keep one token mapped to one user at a time.
    // Shared browsers/devices can otherwise leave the same token attached to multiple accounts.
    await User.bulkWrite([
        {
            updateMany: {
                filter: { 'fcmTokens.token': token },
                update: { $pull: { fcmTokens: { token } } }
            }
        },
        {
            updateOne: {
                filter: { _id: userId },
                update: {
                    $push: {
                        fcmTokens: {
                            token,
                            platform,
                            lastActive: new Date()
                        }
                    }
                }
            }
        }
    ]);

    // Subscribe to Topics
    try {
        await admin.messaging().subscribeToTopic(token, 'all_users');
        if (platform) {
            await admin.messaging().subscribeToTopic(token, `platform_${platform}`);
        }
    } catch (err) {
        logger.error('Topic subscription failed', { error: err instanceof Error ? err.message : String(err) });
    }
};

/**
 * Send Notification to a User
 */
export const sendNotification = async (userId: string, title: string, body: string, data: Record<string, string> = {}) => {
    try {
        const config = await getSystemConfigDoc();
        const pushConfig = config?.notifications?.push;
        if ((pushConfig?.enabled ?? false) === false) {
            return;
        }
        if (pushConfig?.provider && pushConfig.provider !== 'firebase') {
            logger.warn('Push notification provider is not implemented; notification skipped', {
                provider: pushConfig.provider
            });
            return;
        }

        const user = await User.findById(userId).select('fcmTokens');
        if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;

        const tokens = user.fcmTokens.map(t => t.token);

        // Construct Message
        const message = {
            notification: { title, body },
            data,
            tokens
        };

        const messaging = admin.messaging() as unknown as MessagingService;
        const sendMulticast = messaging.sendMulticast || messaging.sendEachForMulticast;
        if (!sendMulticast) {
            logger.warn('FCM multicast method unavailable; skipping push notification');
            return;
        }

        // Send Multicast
        const response = await sendMulticast(message);

        // Cleanup Invalid Tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errCode = resp.error?.code;
                    if (errCode === 'messaging/invalid-registration-token' ||
                        errCode === 'messaging/registration-token-not-registered') {
                        failedTokens.push(tokens[idx] || '');
                    }
                }
            });

            if (failedTokens.length > 0) {
                await User.updateOne(
                    { _id: userId },
                    { $pull: { fcmTokens: { token: { $in: failedTokens } } } }
                );
                logger.info('Cleaned up stale FCM tokens', { count: failedTokens.length, userId });
            }
        }

    } catch (error) {
        logger.error('FCM send error', { error: error instanceof Error ? error.message : String(error) });
    }
};

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
                    { $match: { userId: new Types.ObjectId(userId), isRead: false } },
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
