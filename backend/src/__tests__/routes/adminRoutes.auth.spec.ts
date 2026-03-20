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
    buildDeterministicSearchCacheKey: jest.fn(() => "search:ads:test"),
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

import adminRoutes, { publicRouter } from "../../routes/adminRoutes";

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/v1/admin", publicRouter);
    app.use("/api/v1/admin", adminRoutes);
    return app;
};

describe("admin routes require authentication", () => {
    const app = buildApp();

    it("protects core admin endpoints with 401 when no admin cookie", async () => {
        const checks = await Promise.all([
            request(app).get("/api/v1/admin/dashboard/stats"),
            request(app).get("/api/v1/admin/users"),
            request(app).get("/api/v1/admin/admin-users"),
            request(app).get("/api/v1/admin/admin-users/65fa29c9d2c1f2e165fa29c9"),
            request(app).patch("/api/v1/admin/users/65fa29c9d2c1f2e165fa29c9/suspend"),
            request(app).patch("/api/v1/admin/users/65fa29c9d2c1f2e165fa29c9/ban"),
            request(app).get("/api/v1/admin/ads"),
            request(app).patch("/api/v1/admin/ads/65fa29c9d2c1f2e165fa29c9/status").send({ status: "approved" }),
            request(app).post("/api/v1/admin/broadcast").send({
                type: "GLOBAL",
                title: "Notice",
                message: "Test",
            }),
            request(app).delete("/api/v1/admin/admin-users/65fa29c9d2c1f2e165fa29c9"),
        ]);

        checks.forEach((res) => {
            expect([401, 429]).toContain(res.status);
            if (res.status === 401) {
                expect(res.body).toEqual(
                    expect.objectContaining({
                        success: false,
                    })
                );
            }
        });
    });

    it("keeps canonical public admin auth alias mounted", async () => {
        const response = await request(app).post("/api/v1/admin/auth/login").send({
            email: "",
            password: "",
        });
        expect(response.status).not.toBe(404);
    });
});
