"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchNotificationRecipients = exports.getNotificationHistory = exports.createScheduledNotification = exports.createNotificationLog = void 0;
const NotificationLog_1 = __importDefault(require("@core/models/NotificationLog"));
const ScheduledNotification_1 = __importDefault(require("@core/models/ScheduledNotification"));
const User_1 = __importDefault(require("@core/models/User"));
const createNotificationLog = async (data) => {
    return NotificationLog_1.default.create(data);
};
exports.createNotificationLog = createNotificationLog;
const createScheduledNotification = async (data) => {
    return ScheduledNotification_1.default.create(data);
};
exports.createScheduledNotification = createScheduledNotification;
const getNotificationHistory = async (logMatch, scheduledMatch, options) => {
    const [logs, logsTotal, scheduled, scheduledTotal] = await Promise.all([
        options.includeLogs
            ? NotificationLog_1.default.find(logMatch)
                .sort({ createdAt: -1 })
                .limit(options.mergeWindow)
                .populate('sentBy', 'firstName lastName email')
            : Promise.resolve([]),
        options.includeLogs ? NotificationLog_1.default.countDocuments(logMatch) : Promise.resolve(0),
        options.includeScheduled
            ? ScheduledNotification_1.default.find(scheduledMatch)
                .sort({ sendAt: -1 })
                .limit(options.mergeWindow)
                .populate('sentBy', 'firstName lastName email')
            : Promise.resolve([]),
        options.includeScheduled ? ScheduledNotification_1.default.countDocuments(scheduledMatch) : Promise.resolve(0),
    ]);
    return { logs, logsTotal, scheduled, scheduledTotal };
};
exports.getNotificationHistory = getNotificationHistory;
const searchNotificationRecipients = async (query, limit) => {
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return User_1.default.find({
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
exports.searchNotificationRecipients = searchNotificationRecipients;
//# sourceMappingURL=AdminNotificationService.js.map