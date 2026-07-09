/**
 * NotificationService & Dispatcher — Unit Tests
 */

const mockBulkWrite = jest.fn();
const mockUpdateOne = jest.fn();
const mockFindById = jest.fn();
const mockSubscribeToTopic = jest.fn();
const mockSendEachForMulticast = jest.fn();
const mockMessaging = jest.fn(() => ({
    subscribeToTopic: mockSubscribeToTopic,
    sendEachForMulticast: mockSendEachForMulticast,
}));
const mockGetSystemConfigDoc = jest.fn();
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const mockReserveIdempotencySlot = jest.fn();
const mockReleaseIdempotencySlot = jest.fn();
const mockAddJobWithTrace = jest.fn();
const mockIncrementVersion = jest.fn();
const mockGetIO = jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
}));

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        bulkWrite: mockBulkWrite,
        updateOne: mockUpdateOne,
        findById: mockFindById,
    },
}));

jest.mock("../../models/Notification", () => {
    return jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue({ _id: 'notif_123' }),
        _id: 'notif_123'
    }));
});

jest.mock("../../config/firebaseAdmin", () => ({
    __esModule: true,
    default: { messaging: mockMessaging },
}));

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: mockLogger,
}));

jest.mock("../../utils/systemConfigHelper", () => ({
    __esModule: true,
    getSystemConfigDoc: mockGetSystemConfigDoc,
}));

jest.mock("../../queues/queueIdempotency", () => ({
    reserveQueueIdempotencySlot: mockReserveIdempotencySlot,
    releaseQueueIdempotencySlot: mockReleaseIdempotencySlot,
}));

jest.mock("../../utils/queueWrapper", () => ({
    addJobWithTrace: mockAddJobWithTrace,
}));

jest.mock("../../services/notification/NotificationVersionService", () => ({
    NotificationVersionService: {
        incrementVersion: mockIncrementVersion,
    },
}));

jest.mock("../../queues/redisConnection", () => ({
    isQueueConnectionAvailable: jest.fn().mockReturnValue(true),
}));

jest.mock("../../config/socket", () => ({
    getIO: mockGetIO,
}));



jest.mock("../../services/notification/NotificationPreferenceService", () => ({
    resolveNotificationDeliveryPlan: jest.fn().mockResolvedValue({
        suppress: false,
        channels: ['in-app', 'push']
    }),
}));

import User from "../../models/User";
import Notification from "../../models/Notification";
import { NotificationDispatcher } from "../../services/notification/NotificationDispatcher";
import { NotificationIntent } from "../../domain/NotificationIntent";
import { 
    registerToken, 
    sendNotification, 
    createInAppNotification, 
    dispatchTemplatedNotification 
} from "../../services/NotificationService";

describe("NotificationService & Dispatcher", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockReserveIdempotencySlot.mockResolvedValue(true);
        mockIncrementVersion.mockResolvedValue(10);
        mockGetSystemConfigDoc.mockResolvedValue({
            notifications: { push: { enabled: true, provider: "firebase" } },
        });
    });

    // ── Push Gateway Tests ───────────────────────────────────────────────────

    describe("PushGatewayService", () => {
        it("registers a device token and subscribes to topics", async () => {
            await registerToken("user-1", "token-1", "android");
            expect(mockBulkWrite).toHaveBeenCalled();
            expect(mockSubscribeToTopic).toHaveBeenCalledWith("token-1", "all_users");
        });

        it("sends a multicast push", async () => {
            const select = jest.fn().mockResolvedValue({ fcmTokens: [{ token: "token-1" }] });
            (User.findById as jest.Mock).mockReturnValue({ select });
            mockSendEachForMulticast.mockResolvedValue({ failureCount: 0, responses: [{ success: true }] });

            await sendNotification("user-1", "Title", "Body");
            expect(mockSendEachForMulticast).toHaveBeenCalledWith(expect.objectContaining({
                tokens: ["token-1"]
            }));
        });
    });

    // ── Dispatcher Tests ─────────────────────────────────────────────────────

    describe("NotificationDispatcher", () => {
        it("enqueues a notification intent with idempotency check", async () => {
            const intent = new NotificationIntent({
                userId: "user-1",
                type: "SYSTEM",
                entityRef: { domain: "test", id: "123" },
                message: { title: "Hello", body: "World" }
            });

            const result = await NotificationDispatcher.dispatch(intent);

            expect(result.success).toBe(true);
            expect(mockReserveIdempotencySlot).toHaveBeenCalled();
            expect(mockAddJobWithTrace).toHaveBeenCalled();
        });

        it("skips enqueuing if dedupKey is already reserved", async () => {
            mockReserveIdempotencySlot.mockResolvedValue(false);
            const intent = new NotificationIntent({
                userId: "user-1",
                type: "SYSTEM",
                entityRef: { domain: "test", id: "123" },
                message: { title: "Hello", body: "World" }
            });

            const result = await NotificationDispatcher.dispatch(intent);

            expect(result.skipped).toBe(true);
            expect(mockAddJobWithTrace).not.toHaveBeenCalled();
        });

        it("executes dispatch: saves to DB and emits via WebSocket", async () => {
            const intent = new NotificationIntent({
                userId: "user-1",
                type: "SYSTEM",
                entityRef: { domain: "test", id: "123" },
                message: { title: "Hello", body: "World" },
                channels: ['in-app']
            });

            const result = await NotificationDispatcher.executeDispatch(intent);

            expect(result.success).toBe(true);
            expect(Notification).toHaveBeenCalled();
            expect(mockIncrementVersion).toHaveBeenCalledWith("user-1");
            expect(mockGetIO).toHaveBeenCalled();
        });

        it("suppresses notification if user preference says so", async () => {
            const { resolveNotificationDeliveryPlan } = require("../../services/notification/NotificationPreferenceService");
            resolveNotificationDeliveryPlan.mockResolvedValueOnce({ suppress: true });

            const intent = new NotificationIntent({
                userId: "user-1",
                type: "SYSTEM",
                entityRef: { domain: "test", id: "123" },
                message: { title: "Hello", body: "World" }
            });

            const result = await NotificationDispatcher.executeDispatch(intent);

            expect(result.skipped).toBe(true);
            expect(Notification).not.toHaveBeenCalled();
        });
    });

    // ── Helper Service Tests ─────────────────────────────────────────────────

    describe("In-App and Templated Helpers", () => {
        it("createInAppNotification should route through dispatcher", async () => {
            const spy = jest.spyOn(NotificationDispatcher, 'dispatch').mockResolvedValue({ success: true });
            
            await createInAppNotification("user-1", "SYSTEM" as any, "Title", "Message");

            expect(spy).toHaveBeenCalledWith(expect.objectContaining({
                userId: "user-1",
                type: "SYSTEM"
            }));
        });

        it("dispatchTemplatedNotification should render and route", async () => {
            const spy = jest.spyOn(NotificationDispatcher, 'dispatch').mockResolvedValue({ success: true });
            
            await dispatchTemplatedNotification("user-1", "BUSINESS_APPROVED" as any, "BUSINESS_APPROVED", { name: "Store" });

            expect(spy).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.objectContaining({
                    title: 'Business Profile Approved! 🏢'
                })
            }));
        });
    });
});
