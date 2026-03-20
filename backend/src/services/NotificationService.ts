import User from '../models/User';
import admin from '../config/firebaseAdmin';
import logger from '../utils/logger';
import Notification from '../models/Notification';

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
    // Atomic: pull existing token entry then push fresh one in a single round-trip
    await User.bulkWrite([
        {
            updateOne: {
                filter: { _id: userId },
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

/**
 * Create an In-App Notification and optional FCM
 */
export const createInAppNotification = async (
    userId: string,
    type: 'SMART_ALERT' | 'ORDER_UPDATE' | 'AD_STATUS' | 'BUSINESS_STATUS' | 'SYSTEM' | 'PRICE_DROP' | 'CHAT',
    title: string,
    message: string,
    data: Record<string, unknown> = {}
) => {
    try {
        // 1. Create DB Record
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            data,
            isRead: false
        });

        // 2. Trigger FCM (Fire & Forget)
        sendNotification(userId, title, message, {
            ...data,
            notificationId: notification._id.toString(),
            type
        });

        return notification;
    } catch (error) {
        logger.error('Failed to create in-app notification', { error: error instanceof Error ? error.message : String(error) });
        return null;
    }
};
