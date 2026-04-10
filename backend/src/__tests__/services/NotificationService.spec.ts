const mockBulkWrite = jest.fn();
const mockUpdateOne = jest.fn();
const mockFindById = jest.fn();
const mockSubscribeToTopic = jest.fn();
const mockSendMulticast = jest.fn();
const mockSendEachForMulticast = jest.fn();
const mockMessaging = jest.fn(() => ({
    subscribeToTopic: mockSubscribeToTopic,
    sendMulticast: mockSendMulticast,
    sendEachForMulticast: mockSendEachForMulticast,
}));
const mockGetSystemConfigDoc = jest.fn();
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        bulkWrite: mockBulkWrite,
        updateOne: mockUpdateOne,
        findById: mockFindById,
    },
}));

jest.mock("../../config/firebaseAdmin", () => ({
    __esModule: true,
    default: {
        messaging: mockMessaging,
    },
}));

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: mockLogger,
}));

jest.mock("../../utils/systemConfigHelper", () => ({
    __esModule: true,
    getSystemConfigDoc: mockGetSystemConfigDoc,
}));

jest.mock("../../services/notification/NotificationDispatcher", () => ({
    NotificationDispatcher: {
        dispatch: jest.fn(),
    },
}));

jest.mock("../../domain/NotificationIntent", () => ({
    NotificationIntent: jest.fn().mockImplementation((payload) => payload),
}));

import User from "../../models/User";
import { getSystemConfigDoc } from "../../utils/systemConfigHelper";
import { registerToken, sendNotification } from "../../services/NotificationService";

const mockedUser = User as unknown as {
    bulkWrite: jest.Mock;
    updateOne: jest.Mock;
    findById: jest.Mock;
};
const mockedGetSystemConfigDoc = getSystemConfigDoc as jest.Mock;

describe("NotificationService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockBulkWrite.mockResolvedValue(undefined);
        mockUpdateOne.mockResolvedValue(undefined);
        mockSubscribeToTopic.mockResolvedValue(undefined);
        mockSendMulticast.mockResolvedValue({
            failureCount: 0,
            responses: [{ success: true }],
        });
        mockSendEachForMulticast.mockResolvedValue({
            failureCount: 0,
            responses: [{ success: true }],
        });
        mockMessaging.mockImplementation(() => ({
            subscribeToTopic: mockSubscribeToTopic,
            sendMulticast: mockSendMulticast,
            sendEachForMulticast: mockSendEachForMulticast,
        }));
        mockedGetSystemConfigDoc.mockResolvedValue({
            notifications: {
                push: {
                    enabled: true,
                    provider: "firebase",
                },
            },
        });
    });

    it("registers a device token and subscribes it to the expected topics", async () => {
        await registerToken("user-1", "token-1", "android");

        expect(mockedUser.bulkWrite).toHaveBeenCalledWith([
            {
                updateMany: {
                    filter: { "fcmTokens.token": "token-1" },
                    update: { $pull: { fcmTokens: { token: "token-1" } } },
                },
            },
            {
                updateOne: {
                    filter: { _id: "user-1" },
                    update: {
                        $push: {
                            fcmTokens: {
                                token: "token-1",
                                platform: "android",
                                lastActive: expect.any(Date),
                            },
                        },
                    },
                },
            },
        ]);
        expect(mockSubscribeToTopic).toHaveBeenNthCalledWith(1, "token-1", "all_users");
        expect(mockSubscribeToTopic).toHaveBeenNthCalledWith(2, "token-1", "platform_android");
    });

    it("logs topic subscription failures without failing token registration", async () => {
        mockSubscribeToTopic.mockRejectedValueOnce(new Error("subscription failed"));

        await expect(registerToken("user-1", "token-1", "web")).resolves.toBeUndefined();

        expect(mockLogger.error).toHaveBeenCalledWith("Topic subscription failed", {
            error: "subscription failed",
        });
    });

    it("sends a multicast push and removes stale FCM tokens returned by Firebase", async () => {
        const select = jest.fn().mockResolvedValue({
            fcmTokens: [{ token: "good" }, { token: "stale-1" }, { token: "stale-2" }],
        });
        mockedUser.findById.mockReturnValue({ select });
        mockMessaging.mockImplementation(() => ({
            subscribeToTopic: mockSubscribeToTopic,
            sendEachForMulticast: mockSendEachForMulticast,
        }));
        mockSendEachForMulticast.mockResolvedValue({
            failureCount: 2,
            responses: [
                { success: true },
                { success: false, error: { code: "messaging/invalid-registration-token" } },
                { success: false, error: { code: "messaging/registration-token-not-registered" } },
            ],
        });

        await sendNotification("user-1", "Order Update", "Device is ready", { screen: "orders" });

        expect(select).toHaveBeenCalledWith("fcmTokens");
        expect(mockSendEachForMulticast).toHaveBeenCalledWith({
            notification: { title: "Order Update", body: "Device is ready" },
            data: { screen: "orders" },
            tokens: ["good", "stale-1", "stale-2"],
        });
        expect(mockedUser.updateOne).toHaveBeenCalledWith(
            { _id: "user-1" },
            { $pull: { fcmTokens: { token: { $in: ["stale-1", "stale-2"] } } } }
        );
        expect(mockLogger.info).toHaveBeenCalledWith("Cleaned up stale FCM tokens", {
            count: 2,
            userId: "user-1",
        });
    });

    it("skips push delivery when another provider is configured", async () => {
        mockedGetSystemConfigDoc.mockResolvedValue({
            notifications: {
                push: {
                    enabled: true,
                    provider: "onesignal",
                },
            },
        });

        await sendNotification("user-1", "Title", "Body");

        expect(mockedUser.findById).not.toHaveBeenCalled();
        expect(mockSendMulticast).not.toHaveBeenCalled();
        expect(mockSendEachForMulticast).not.toHaveBeenCalled();
        expect(mockLogger.warn).toHaveBeenCalledWith(
            "Push notification provider is not implemented; notification skipped",
            { provider: "onesignal" }
        );
    });
});
