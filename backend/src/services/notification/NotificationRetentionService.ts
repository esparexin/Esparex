import Notification from "../../models/Notification";
import { READ_NOTIFICATION_RETENTION_HOURS, READ_NOTIFICATION_RETENTION_MS } from "../../../../shared/constants/notificationRetention";

export const getNotificationReadRetentionCutoff = (now: Date = new Date()) =>
    new Date(now.getTime() - READ_NOTIFICATION_RETENTION_MS);

export const getVisibleNotificationWindowQuery = (now: Date = new Date()) => ({
    $or: [
        { isRead: false },
        { isRead: true, readAt: { $gte: getNotificationReadRetentionCutoff(now) } },
    ],
});

export const purgeExpiredReadNotifications = async (now: Date = new Date()) => {
    const cutoff = getNotificationReadRetentionCutoff(now);

    const result = await Notification.deleteMany({
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
        retentionHours: READ_NOTIFICATION_RETENTION_HOURS,
    };
};
