import User from '../../models/User';
import admin from '../../config/firebaseAdmin';
import logger from '../../utils/logger';
import { getSystemConfigDoc } from '../../utils/systemConfigHelper';

export interface TokenResponse {
    success: boolean;
    error?: { code?: string };
}

export interface MulticastResponse {
    failureCount: number;
    responses: TokenResponse[];
}

export interface MessagingService {
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
