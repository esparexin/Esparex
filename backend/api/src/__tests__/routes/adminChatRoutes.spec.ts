import express from 'express';
import inject from 'light-my-request';

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
    getCache: jest.fn(async () => null),
    setCache: jest.fn(async () => false),
    delCache: jest.fn(async () => false),
    clearCachePattern: jest.fn(async () => 0),
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
}));

jest.mock('@esparex/core/services/chat/ChatAdminService', () => ({
    adminListConversations: jest.fn(async () => ({ convs: [], total: 0 })),
    adminGetConversation: jest.fn(async (id: string) => {
        if (id === '507f1f77bcf86cd799439011') {
            return { conv: { id }, messages: [], reports: [] };
        }
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    }),
    adminMuteConversation: jest.fn(async () => undefined),
    adminExportConversation: jest.fn(async (id: string) => ({ conversationId: id, messages: [] })),
}));

import adminChatRoutes from '../../routes/adminChatRoutes';

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/admin/chat', adminChatRoutes);
    return app;
};

describe('admin chat routes authentication & contract', () => {
    const app = buildApp();

    it('rejects unauthenticated requests to GET /list', async () => {
        const response = await inject(app, {
            method: 'GET',
            url: '/api/v1/admin/chat/list',
        });

        expect(response.statusCode).toBe(401);
        expect(response.json()).toEqual(
            expect.objectContaining({
                success: false,
            })
        );
    });

    it('rejects unauthenticated requests to POST /mute/:id', async () => {
        const response = await inject(app, {
            method: 'POST',
            url: '/api/v1/admin/chat/mute/507f1f77bcf86cd799439011',
        });

        expect(response.statusCode).toBe(401);
    });

    it('mounts canonical list, mute, and export routes', () => {
        const stack = (adminChatRoutes as any).stack ?? [];
        const paths = stack.map((layer: any) => layer.route?.path).filter(Boolean);

        expect(paths).toContain('/list');
        expect(paths).toContain('/:id');
        expect(paths).toContain('/mute/:id');
        expect(paths).toContain('/export/:id');
    });
});
