import express from "express";
import request from "supertest";
import cookieParser from "cookie-parser";

jest.mock("../../utils/redisCache", () => ({
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

import chatRoutes from "../../routes/chatRoutes";

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/v1/chat", chatRoutes);
    return app;
};

describe("chat routes auth contract", () => {
    const app = buildApp();

    it("keeps the canonical conversation route protected", async () => {
        const response = await request(app).get("/api/v1/chat/abc123");

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                success: false,
            })
        );
    });

    it("keeps the messages route protected", async () => {
        const response = await request(app).get("/api/v1/chat/abc123/messages");

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                success: false,
            })
        );
    });

    it("mounts the canonical single-conversation route", () => {
        const stack = (chatRoutes as unknown as { stack?: Array<{ route?: { path?: string } }> }).stack ?? [];
        expect(stack.some((layer) => layer.route?.path === "/:id")).toBe(true);
    });

    it("does not mount legacy admin moderation aliases under /api/v1/chat", () => {
        const stack = (chatRoutes as unknown as { stack?: Array<{ route?: { path?: string } }> }).stack ?? [];
        expect(stack.some((layer) => layer.route?.path === "/admin/list")).toBe(false);
        expect(stack.some((layer) => layer.route?.path === "/admin/:id")).toBe(false);
    });
});
