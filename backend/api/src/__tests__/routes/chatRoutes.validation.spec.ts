import express from "express";
import inject from "light-my-request";
import cookieParser from "cookie-parser";

// Mock redis
jest.mock("@esparex/core/utils/redisCache", () => ({
    __esModule: true,
    default: {
        on: jest.fn(),
    },
    isConnected: false,
    isHighMemoryPressure: false,
    cacheMetrics: {
        hits: 0,
        misses: 0,
        errors: 0,
        keys: 0,
        memory: 0,
        lastUpdated: new Date(),
    },
    buildDeterministicSearchCacheKey: jest.fn(() => "chat:test"),
    getCache: jest.fn(async () => null),
    setCache: jest.fn(async () => false),
    delCache: jest.fn(async () => false),
    clearCachePattern: jest.fn(async () => 0),
    invalidateAdFeedCaches: jest.fn(async () => undefined),
    invalidatePublicAdCache: jest.fn(async () => undefined),
    scanKeysByPattern: jest.fn(async () => []),
    getRedisHealthProbe: jest.fn(async () => ({
        connected: false,
        pingOk: false,
        roundTripOk: false,
        latencyMs: null,
        error: "mocked in tests",
    })),
    blacklistToken: jest.fn(async () => undefined),
    isTokenBlacklisted: jest.fn(async () => false),
    getCacheStats: jest.fn(async () => ({})),
}));

// Mock ChatService
const mockGetConversationForUser = jest.fn();
const mockGetMessages = jest.fn();

jest.mock("@esparex/core/services/ChatService", () => ({
    getConversationForUser: (...args: unknown[]) => mockGetConversationForUser(...args),
    getMessages: (...args: unknown[]) => mockGetMessages(...args),
}));

// Mock authMiddleware to inject a dummy user
jest.mock("../../middleware/authMiddleware", () => ({
    protect: jest.fn((req: any, _res: any, next: () => void) => {
        req.user = { id: "507f1f77bcf86cd799439011", _id: "507f1f77bcf86cd799439011" };
        next();
    }),
}));

import chatRoutes from "../../routes/chatRoutes";

const buildApp = () => {
    const app = PatternApp();
    return app;
};

function PatternApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/v1/chat", chatRoutes);
    return app;
}



describe("chat routes validation contracts", () => {
    const app = buildApp();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("rejects conversation lookup for an invalid route parameter id", async () => {
        const response = await inject(app, {
            method: "GET",
            url: "/api/v1/chat/invalid-id",
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual(
            expect.objectContaining({
                success: false,
                error: "Invalid ID Format"
            })
        );
        expect(mockGetConversationForUser).not.toHaveBeenCalled();
    });

    it("rejects conversation messages lookup for an invalid route parameter id", async () => {
        const response = await inject(app, {
            method: "GET",
            url: "/api/v1/chat/invalid-id/messages",
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual(
            expect.objectContaining({
                success: false,
                error: "Invalid ID Format"
            })
        );
        expect(mockGetMessages).not.toHaveBeenCalled();
    });

    it("accepts and forwards a valid MongoDB ObjectId to the ChatService", async () => {
        mockGetConversationForUser.mockResolvedValue({ id: "507f1f77bcf86cd799439011" });

        const response = await inject(app, {
            method: "GET",
            url: "/api/v1/chat/507f1f77bcf86cd799439011",
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data).toEqual(
            expect.objectContaining({
                id: "507f1f77bcf86cd799439011"
            })
        );
        expect(mockGetConversationForUser).toHaveBeenCalledWith(
            "507f1f77bcf86cd799439011",
            "507f1f77bcf86cd799439011"
        );
    });
});
