jest.mock("../../models/NotificationLog", () => ({
    __esModule: true,
    default: { create: jest.fn().mockResolvedValue({ _id: "log-id" }) },
}));

jest.mock("../../models/ScheduledNotification", () => ({
    __esModule: true,
    default: { create: jest.fn() },
}));

jest.mock("../../services/notification/AdminNotificationTargetingService", () => ({
    createAdminNotificationTargetCursor: jest.fn(),
}));

jest.mock("../../services/notification/NotificationDispatcher", () => ({
    NotificationDispatcher: {
        bulkDispatch: jest.fn().mockResolvedValue({ successCount: 0, skippedCount: 0, failureCount: 0 }),
    },
}));

jest.mock("../../domain/NotificationIntent", () => ({
    NotificationIntent: {
        fromAdminBroadcast: jest.fn((userId, audienceId, title, body, kind, targetType) => ({
            userId,
            audienceId,
            title,
            body,
            kind,
            targetType,
        })),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

import NotificationLog from "../../models/NotificationLog";
import { NotificationDispatcher } from "../../services/notification/NotificationDispatcher";
import { NotificationIntent } from "../../domain/NotificationIntent";
import { createAdminNotificationTargetCursor } from "../../services/notification/AdminNotificationTargetingService";
import { sendNotification } from "../../controllers/admin/adminNotificationController";

const mockedNotificationLog = NotificationLog as unknown as { create: jest.Mock };
const mockedDispatcher = NotificationDispatcher as unknown as { bulkDispatch: jest.Mock };
const mockedIntent = NotificationIntent as unknown as { fromAdminBroadcast: jest.Mock };
const mockedTargetCursor = createAdminNotificationTargetCursor as unknown as jest.Mock;

const makeReq = (body: Record<string, unknown> = {}) =>
    ({
        user: {
            _id: "admin-id",
            role: "super_admin",
            permissions: ["content:write"],
        },
        body: { title: "Test", body: "Hello", targetType: "all", ...body },
        headers: {},
        ip: "127.0.0.1",
        originalUrl: "/api/v1/admin/notifications/send",
        method: "POST",
        path: "/api/v1/admin/notifications/send",
    }) as any;

const makeRes = () =>
    ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    }) as any;

function makeCursor(users: Array<{ _id: string }>) {
    return {
        [Symbol.asyncIterator]: async function* () {
            for (const user of users) yield user;
        },
    };
}

describe("admin notifications dispatch", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedNotificationLog.create.mockResolvedValue({ _id: "log-id" });
    });

    it("builds one intent per targeted user and dispatches them", async () => {
        mockedTargetCursor.mockReturnValue(makeCursor([{ _id: "u1" }, { _id: "u2" }, { _id: "u3" }]));
        mockedDispatcher.bulkDispatch.mockResolvedValue({ successCount: 3, skippedCount: 0, failureCount: 0 });

        const req = makeReq();
        const res = makeRes();

        await sendNotification(req, res);

        expect(mockedTargetCursor).toHaveBeenCalledWith({
            targetType: "all",
            targetValue: undefined,
            userIds: undefined,
        });
        expect(mockedIntent.fromAdminBroadcast).toHaveBeenCalledTimes(3);
        expect(mockedDispatcher.bulkDispatch).toHaveBeenCalledTimes(1);
        expect(mockedDispatcher.bulkDispatch.mock.calls[0][0]).toHaveLength(3);
    });

    it("dispatches in batches of 500 and flushes the remainder", async () => {
        mockedTargetCursor.mockReturnValue(
            makeCursor(Array.from({ length: 1200 }, (_, index) => ({ _id: `u${index}` })))
        );
        mockedDispatcher.bulkDispatch
            .mockResolvedValueOnce({ successCount: 500, skippedCount: 0, failureCount: 0 })
            .mockResolvedValueOnce({ successCount: 500, skippedCount: 0, failureCount: 0 })
            .mockResolvedValueOnce({ successCount: 200, skippedCount: 0, failureCount: 0 });

        await sendNotification(makeReq(), makeRes());

        expect(mockedDispatcher.bulkDispatch).toHaveBeenCalledTimes(3);
        expect(mockedDispatcher.bulkDispatch.mock.calls[0][0]).toHaveLength(500);
        expect(mockedDispatcher.bulkDispatch.mock.calls[1][0]).toHaveLength(500);
        expect(mockedDispatcher.bulkDispatch.mock.calls[2][0]).toHaveLength(200);
    });

    it("records failure status when delivery fails for every target", async () => {
        mockedTargetCursor.mockReturnValue(makeCursor([{ _id: "u1" }]));
        mockedDispatcher.bulkDispatch.mockResolvedValue({ successCount: 0, skippedCount: 0, failureCount: 1 });

        await sendNotification(makeReq(), makeRes());

        expect(mockedNotificationLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "failed",
                successCount: 0,
                failureCount: 1,
            })
        );
    });
});
