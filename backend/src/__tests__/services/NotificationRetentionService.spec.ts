jest.mock("../../models/Notification", () => ({
    __esModule: true,
    default: {
        deleteMany: jest.fn(),
    },
}));

import Notification from "../../models/Notification";
import {
    getNotificationReadRetentionCutoff,
    getVisibleNotificationWindowQuery,
    purgeExpiredReadNotifications,
} from "../../services/notification/NotificationRetentionService";

const mockedNotification = Notification as unknown as { deleteMany: jest.Mock };

describe("NotificationRetentionService", () => {
    beforeEach(() => {
        mockedNotification.deleteMany.mockReset();
    });

    it("builds a visible window query that keeps unread and recently read items", () => {
        const now = new Date("2026-03-28T12:00:00.000Z");
        const cutoff = getNotificationReadRetentionCutoff(now);

        expect(getVisibleNotificationWindowQuery(now)).toEqual({
            $or: [
                { isRead: false },
                { isRead: true, readAt: { $gte: cutoff } },
            ],
        });
    });

    it("purges expired read notifications using the retention cutoff", async () => {
        const now = new Date("2026-03-28T12:00:00.000Z");
        mockedNotification.deleteMany.mockResolvedValue({ deletedCount: 7 });

        const result = await purgeExpiredReadNotifications(now);

        expect(mockedNotification.deleteMany).toHaveBeenCalledWith({
            isRead: true,
            $or: [
                { readAt: { $lte: result.cutoff } },
                { readAt: { $exists: false }, createdAt: { $lte: result.cutoff } },
                { readAt: null, createdAt: { $lte: result.cutoff } },
            ],
        });
        expect(result.deletedCount).toBe(7);
    });
});
