import NotificationLog from '../models/NotificationLog';
import ScheduledNotification from '../models/ScheduledNotification';
import User from '../models/User';

export const createNotificationLog = async (data: Record<string, unknown>) => {
    return NotificationLog.create(data);
};

export const createScheduledNotification = async (data: Record<string, unknown>) => {
    return ScheduledNotification.create(data);
};

export const getNotificationHistory = async (
    logMatch: Record<string, unknown>,
    scheduledMatch: Record<string, unknown> & { status: 'pending' },
    options: {
        includeLogs: boolean;
        includeScheduled: boolean;
        mergeWindow: number;
    }
) => {
    const [logs, logsTotal, scheduled, scheduledTotal] = await Promise.all([
        options.includeLogs
            ? NotificationLog.find(logMatch)
                  .sort({ createdAt: -1 })
                  .limit(options.mergeWindow)
                  .populate('sentBy', 'firstName lastName email')
            : Promise.resolve([]),
        options.includeLogs ? NotificationLog.countDocuments(logMatch) : Promise.resolve(0),
        options.includeScheduled
            ? ScheduledNotification.find(scheduledMatch)
                  .sort({ sendAt: -1 })
                  .limit(options.mergeWindow)
                  .populate('sentBy', 'firstName lastName email')
            : Promise.resolve([]),
        options.includeScheduled ? ScheduledNotification.countDocuments(scheduledMatch) : Promise.resolve(0),
    ]);

    return { logs, logsTotal, scheduled, scheduledTotal };
};

export const searchNotificationRecipients = async (query: string, limit: number) => {
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return User.find({
        isDeleted: { $ne: true },
        status: { $nin: ['deleted', 'banned'] },
        role: { $in: ['user', 'business'] },
        $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { mobile: { $regex: searchRegex } },
            { firstName: { $regex: searchRegex } },
            { lastName: { $regex: searchRegex } },
        ],
    })
        .select('name firstName lastName email mobile')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};
