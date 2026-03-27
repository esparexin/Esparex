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
    buildDeterministicSearchCacheKey: jest.fn(() => "search:listings:test"),
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

import listingRoutes from "../../routes/listingRoutes";

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/v1/listings", listingRoutes);
    return app;
};

describe("listing routes precedence", () => {
    const app = buildApp();

    it("keeps /mine protected instead of resolving it as a public listing slug", async () => {
        const response = await request(app).get("/api/v1/listings/mine");

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                success: false,
            })
        );
    });

    it("keeps /mine/stats protected instead of resolving it as a public listing slug", async () => {
        const response = await request(app).get("/api/v1/listings/mine/stats");

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                success: false,
            })
        );
    });

    it("mounts the canonical phone reveal route", () => {
        const stack = (listingRoutes as unknown as { stack?: Array<{ route?: { path?: string } }> }).stack ?? [];
        expect(stack.some((layer) => layer.route?.path === "/:id/phone")).toBe(true);
    });
});
