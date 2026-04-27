"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeExpiredReadNotifications = exports.getVisibleNotificationWindowQuery = exports.getNotificationReadRetentionCutoff = void 0;
const Notification_1 = __importDefault(require("@core/models/Notification"));
const notificationRetention_1 = require("@shared/constants/notificationRetention");
const getNotificationReadRetentionCutoff = (now = new Date()) => new Date(now.getTime() - notificationRetention_1.READ_NOTIFICATION_RETENTION_MS);
exports.getNotificationReadRetentionCutoff = getNotificationReadRetentionCutoff;
const getVisibleNotificationWindowQuery = (now = new Date()) => ({
    $or: [
        { isRead: false },
        { isRead: true, readAt: { $gte: (0, exports.getNotificationReadRetentionCutoff)(now) } },
    ],
});
exports.getVisibleNotificationWindowQuery = getVisibleNotificationWindowQuery;
const purgeExpiredReadNotifications = async (now = new Date()) => {
    const cutoff = (0, exports.getNotificationReadRetentionCutoff)(now);
    const result = await Notification_1.default.deleteMany({
        isRead: true,
        $or: [
            { readAt: { $lte: cutoff } },
            { readAt: { $exists: false }, createdAt: { $lte: cutoff } },
            { readAt: null, createdAt: { $lte: cutoff } },
        ],
    });
    return {
        deletedCount: result.deletedCount ?? 0,
        cutoff,
        retentionHours: notificationRetention_1.READ_NOTIFICATION_RETENTION_HOURS,
    };
};
exports.purgeExpiredReadNotifications = purgeExpiredReadNotifications;
//# sourceMappingURL=NotificationRetentionService.js.map