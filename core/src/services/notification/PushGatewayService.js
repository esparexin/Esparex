"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = exports.registerToken = void 0;
const User_1 = __importDefault(require("@core/models/User"));
const firebaseAdmin_1 = __importDefault(require("@core/config/firebaseAdmin"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const systemConfigHelper_1 = require("@core/utils/systemConfigHelper");
/**
 * Register a Device Token
 */
const registerToken = async (userId, token, platform = 'web') => {
    // Keep one token mapped to one user at a time.
    // Shared browsers/devices can otherwise leave the same token attached to multiple accounts.
    await User_1.default.bulkWrite([
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
        await firebaseAdmin_1.default.messaging().subscribeToTopic(token, 'all_users');
        if (platform) {
            await firebaseAdmin_1.default.messaging().subscribeToTopic(token, `platform_${platform}`);
        }
    }
    catch (err) {
        logger_1.default.error('Topic subscription failed', { error: err instanceof Error ? err.message : String(err) });
    }
};
exports.registerToken = registerToken;
/**
 * Send Notification to a User
 */
const sendNotification = async (userId, title, body, data = {}) => {
    try {
        const config = await (0, systemConfigHelper_1.getSystemConfigDoc)();
        const pushConfig = config?.notifications?.push;
        if ((pushConfig?.enabled ?? false) === false) {
            return;
        }
        if (pushConfig?.provider && pushConfig.provider !== 'firebase') {
            logger_1.default.warn('Push notification provider is not implemented; notification skipped', {
                provider: pushConfig.provider
            });
            return;
        }
        const user = await User_1.default.findById(userId).select('fcmTokens');
        if (!user || !user.fcmTokens || user.fcmTokens.length === 0)
            return;
        const tokens = user.fcmTokens.map(t => t.token);
        // Construct Message
        const message = {
            notification: { title, body },
            data,
            tokens
        };
        const messaging = firebaseAdmin_1.default.messaging();
        const sendMulticast = messaging.sendMulticast || messaging.sendEachForMulticast;
        if (!sendMulticast) {
            logger_1.default.warn('FCM multicast method unavailable; skipping push notification');
            return;
        }
        // Send Multicast
        const response = await sendMulticast(message);
        // Cleanup Invalid Tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
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
                await User_1.default.updateOne({ _id: userId }, { $pull: { fcmTokens: { token: { $in: failedTokens } } } });
                logger_1.default.info('Cleaned up stale FCM tokens', { count: failedTokens.length, userId });
            }
        }
    }
    catch (error) {
        logger_1.default.error('FCM send error', { error: error instanceof Error ? error.message : String(error) });
    }
};
exports.sendNotification = sendNotification;
//# sourceMappingURL=PushGatewayService.js.map