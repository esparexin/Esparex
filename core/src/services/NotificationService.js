"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserNotification = exports.markNotificationReadById = exports.markAllNotificationsRead = exports.dispatchTemplatedNotification = exports.createInAppNotification = exports.queryNotificationsForUser = exports.sendNotification = exports.registerToken = void 0;
const Notification_1 = __importDefault(require("@core/models/Notification"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const NotificationDispatcher_1 = require("./notification/NotificationDispatcher");
const NotificationIntent_1 = require("../domain/NotificationIntent");
const NotificationTemplateService_1 = require("./notification/NotificationTemplateService");
var PushGatewayService_1 = require("./notification/PushGatewayService");
Object.defineProperty(exports, "registerToken", { enumerable: true, get: function () { return PushGatewayService_1.registerToken; } });
Object.defineProperty(exports, "sendNotification", { enumerable: true, get: function () { return PushGatewayService_1.sendNotification; } });
const queryNotificationsForUser = async (query, userId, skip, limit) => {
    // Single aggregation pass: replaces two separate countDocuments calls
    // (one for total, one for unreadCount) that previously ran in parallel.
    const [result] = await Notification_1.default.aggregate([
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
exports.queryNotificationsForUser = queryNotificationsForUser;
/**
 * Create an In-App Notification (and optional FCM push).
 *
 * Thin wrapper around NotificationDispatcher so all writes go through
 * the single gateway: DB save → version increment → WebSocket emit → FCM.
 */
const createInAppNotification = async (userId, type, title, message, data = {}) => {
    try {
        const intent = new NotificationIntent_1.NotificationIntent({
            userId,
            type,
            entityRef: { domain: 'system', id: userId },
            message: { title, body: message, data },
            channels: ['in-app', 'push'],
            priority: 'medium',
        });
        await NotificationDispatcher_1.NotificationDispatcher.dispatch(intent);
    }
    catch (error) {
        logger_1.default.error('Failed to create in-app notification', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.createInAppNotification = createInAppNotification;
/**
 * Higher-level helper to dispatch notifications using a template key.
 */
const dispatchTemplatedNotification = async (userId, type, templateKey, params = {}, data = {}) => {
    const { title, body } = (0, NotificationTemplateService_1.getNotificationTemplate)(templateKey, params);
    return (0, exports.createInAppNotification)(userId, type, title, body, { ...params, ...data });
};
exports.dispatchTemplatedNotification = dispatchTemplatedNotification;
const markAllNotificationsRead = async (userId) => {
    const result = await Notification_1.default.updateMany({ userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
    return result.modifiedCount;
};
exports.markAllNotificationsRead = markAllNotificationsRead;
const markNotificationReadById = async (id, userId) => {
    return Notification_1.default.findOneAndUpdate({ _id: id, userId }, { isRead: true, readAt: new Date() }, { new: true });
};
exports.markNotificationReadById = markNotificationReadById;
const deleteUserNotification = async (id, userId) => {
    return Notification_1.default.findOneAndDelete({ _id: id, userId });
};
exports.deleteUserNotification = deleteUserNotification;
//# sourceMappingURL=NotificationService.js.map