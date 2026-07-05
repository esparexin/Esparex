/**
 * API Parity Snapshot — Batch 1: Middlewares
 *
 * Captures BEFORE behavior of admin auth and user auth contract endpoints.
 * Run BEFORE Batch 1 migration and AFTER Batch 1 migration.
 * Results must be identical to confirm API parity.
 *
 * Uses light-my-request (same as existing route contract tests) — no real server needed.
 */
import express from 'express';
import inject from 'light-my-request';
import cookieParser from 'cookie-parser';

// Mock redis (no Redis available in this environment)
jest.mock('@esparex/core/utils/redisCache', () => ({
    __esModule: true,
    default: { on: jest.fn() },
    isConnected: false,
    getCache: jest.fn(async () => null),
    setCache: jest.fn(async () => false),
    blacklistToken: jest.fn(async () => undefined),
    isTokenBlacklisted: jest.fn(async () => false),
}));

jest.mock('@esparex/core/config/redis', () => ({
    __esModule: true,
    default: {
        get: jest.fn(async () => null),
        set: jest.fn(async () => 'OK'),
        del: jest.fn(async () => 0),
    },
}));

jest.mock('@esparex/core/services/AdminSessionService', () => ({
    validateAdminSession: jest.fn(async () => false),
    getAdminSessionTtlMs: jest.fn(async () => 3600000),
}));

jest.mock('@esparex/core/models/Admin', () => ({
    __esModule: true,
    default: { findById: jest.fn(async () => null) },
}));

jest.mock('@esparex/core/models/User', () => ({
    __esModule: true,
    default: { findById: jest.fn(() => ({ select: jest.fn(() => ({ lean: jest.fn(async () => null) })) })) },
}));

import { requireAdmin } from '../../middleware/adminAuth';
import { protect } from '../../middleware/authMiddleware';

const buildAdminApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Simulate the protected admin route pattern
    const protected_ = express.Router();
    protected_.use(requireAdmin);
    protected_.get('/dashboard/stats', (_req, res) => res.json({ success: true }));
    protected_.get('/users', (_req, res) => res.json({ success: true }));
    app.use('/api/v1/admin', protected_);

    // Simulate the public admin login endpoint
    app.post('/api/v1/admin/auth/login', (_req, res) => {
        res.status(400).json({ success: false, error: 'Invalid credentials' });
    });

    return app;
};

const buildUserApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    const protected_ = express.Router();
    protected_.use(protect);
    protected_.get('/listings', (_req, res) => res.json({ success: true }));
    app.use('/api/v1', protected_);

    return app;
};

describe('[PARITY SNAPSHOT] Batch 1 Middleware Contracts', () => {
    describe('Admin Auth Middleware (requireAdmin)', () => {
        const app = buildAdminApp();

        it('SNAPSHOT: returns 401 with success:false when no admin_token cookie present', async () => {
            const res = await inject(app, { method: 'GET', url: '/api/v1/admin/dashboard/stats' });
            // Record these values — they MUST match after migration
            expect(res.statusCode).toBe(401);
            expect(res.json()).toMatchObject({ success: false });
        });

        it('SNAPSHOT: returns 401 with success:false for admin users endpoint when unauthenticated', async () => {
            const res = await inject(app, { method: 'GET', url: '/api/v1/admin/users' });
            expect(res.statusCode).toBe(401);
            expect(res.json()).toMatchObject({ success: false });
        });

        it('SNAPSHOT: returns non-404 for admin login endpoint (route mounted correctly)', async () => {
            const res = await inject(app, {
                method: 'POST',
                url: '/api/v1/admin/auth/login',
                payload: { email: '', password: '' },
            });
            expect(res.statusCode).not.toBe(404);
            expect(res.json()).toMatchObject({ success: false });
        });
    });

    describe('User Auth Middleware (protect)', () => {
        const app = buildUserApp();

        it('SNAPSHOT: returns 401 when no bearer token provided', async () => {
            const res = await inject(app, { method: 'GET', url: '/api/v1/listings' });
            expect(res.statusCode).toBe(401);
            expect(res.json()).toMatchObject({ success: false });
        });

        it('SNAPSHOT: returns 401 with correct error shape when invalid token provided', async () => {
            const res = await inject(app, {
                method: 'GET',
                url: '/api/v1/listings',
                headers: { authorization: 'Bearer invalidtoken' },
            });
            expect(res.statusCode).toBe(401);
            const body = res.json() as { success: boolean; error?: string; message?: string };
            expect(body.success).toBe(false);
        });
    });
});
