import express from 'express';
import inject from 'light-my-request';
import cookieParser from 'cookie-parser';
import { z } from 'zod';

jest.mock('@esparex/core/utils/redisCache', () => ({
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
    buildDeterministicSearchCacheKey: jest.fn(() => 'search:catalog-requests:test'),
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
        error: 'mocked in tests',
    })),
    blacklistToken: jest.fn(async () => undefined),
    isTokenBlacklisted: jest.fn(async () => false),
    getCacheStats: jest.fn(async () => ({})),
}));

jest.mock(
    '@esparex/core/validators/catalogRequest.validator',
    () => ({
        createCatalogRequestSchema: z.object({}).passthrough(),
        catalogRequestListQuerySchema: z.object({}).passthrough(),
        adminCatalogRequestListQuerySchema: z.object({}).passthrough(),
        adminCatalogRequestStatsQuerySchema: z.object({}).passthrough(),
        approveCatalogRequestSchema: z.object({}).passthrough(),
        rejectCatalogRequestSchema: z.object({}).passthrough(),
        markCatalogRequestDuplicateSchema: z.object({}).passthrough(),
        bulkApproveCatalogRequestSchema: z.object({}).passthrough(),
        bulkRejectCatalogRequestSchema: z.object({}).passthrough(),
        bulkMarkCatalogRequestDuplicateSchema: z.object({}).passthrough(),
    }),
    { virtual: true }
);

jest.mock('../../controllers/catalogRequestController', () => ({
    createCatalogRequest: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    getMyCatalogRequests: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    getAdminCatalogRequests: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    getAdminCatalogRequestById: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    approveCatalogRequestByAdmin: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    rejectCatalogRequestByAdmin: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    markCatalogRequestMergedByAdmin: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    getAdminCatalogRequestStats: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    bulkApproveCatalogRequestsByAdmin: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    bulkRejectCatalogRequestsByAdmin: jest.fn((_req, res) => res.status(200).json({ ok: true })),
    bulkMarkCatalogRequestsMergedByAdmin: jest.fn((_req, res) => res.status(200).json({ ok: true })),
}));

import catalogRequestRoutes from '../../routes/catalogRequestRoutes';
import adminCatalogRequestRoutes from '../../routes/adminCatalogRequestRoutes';

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/v1/catalog-requests', catalogRequestRoutes);
    app.use('/api/v1/admin/catalog-requests', adminCatalogRequestRoutes);
    return app;
};

describe('catalog request routes auth contract', () => {
    const app = buildApp();

    it('protects user catalog request endpoints', async () => {
        const [createResponse, myResponse] = await Promise.all([
            inject(app, {
                method: 'POST',
                url: '/api/v1/catalog-requests',
                payload: {
                    requestType: 'brand',
                    categoryId: '65fa29c9d2c1f2e165fa29c9',
                    requestedName: 'Acme',
                },
            }),
            inject(app, {
                method: 'GET',
                url: '/api/v1/catalog-requests/my',
            }),
        ]);

        expect(createResponse.statusCode).toBe(401);
        expect(myResponse.statusCode).toBe(401);
    });

    it('protects admin catalog request endpoints', async () => {
        const [listResponse, statsResponse, approveResponse] = await Promise.all([
            inject(app, {
                method: 'GET',
                url: '/api/v1/admin/catalog-requests',
            }),
            inject(app, {
                method: 'GET',
                url: '/api/v1/admin/catalog-requests/stats',
            }),
            inject(app, {
                method: 'POST',
                url: '/api/v1/admin/catalog-requests/65fa29c9d2c1f2e165fa29c9/approve',
                payload: { adminNotes: 'ok' },
            }),
        ]);

        expect(listResponse.statusCode).toBe(401);
        expect(statsResponse.statusCode).toBe(401);
        expect(approveResponse.statusCode).toBe(401);
    });
});
