jest.mock("../../models/Broadcast", () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../services/NotificationService", () => ({
    __esModule: true,
    sendNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../config/firebaseAdmin", () => ({
    __esModule: true,
    default: {
        messaging: jest.fn(() => ({
            send: jest.fn().mockResolvedValue("ok"),
        })),
    },
}));

import Broadcast from "../../models/Broadcast";
import { logAdminAction } from "../../utils/adminLogger";
import { createBroadcast } from "../../controllers/admin/adminNotificationController";

const createMockRes = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as any;
    return res;
};

describe("adminNotificationController.createBroadcast", () => {
    const mockBroadcast = Broadcast as unknown as { create: jest.Mock };
    const mockLogAdminAction = logAdminAction as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates a global broadcast record and returns success", async () => {
        mockBroadcast.create.mockResolvedValue({
            _id: { toString: () => "broadcast_1" },
            toJSON: () => ({ id: "broadcast_1", type: "GLOBAL", title: "System Notice" }),
        });

        const req = {
            body: {
                type: "GLOBAL",
                title: "System Notice",
                message: "Maintenance at midnight",
            },
            user: { _id: "admin_1", role: "admin" },
            originalUrl: "/api/v1/admin/broadcast",
        } as any;
        const res = createMockRes();

        await createBroadcast(req, res);

        expect(mockBroadcast.create).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "GLOBAL",
                title: "System Notice",
            })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockLogAdminAction).toHaveBeenCalledWith(
            req,
            "CREATE_BROADCAST",
            "Notification",
            "broadcast_1",
            expect.objectContaining({ type: "GLOBAL" })
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    type: "GLOBAL",
                    delivery: expect.objectContaining({ successCount: 1 }),
                }),
            })
        );
    });
});
