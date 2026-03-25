/**
 * Unit tests for the dispatchToAllUsers helper (Phase 13).
 *
 * The helper is module-private, so we test it indirectly via sendNotification
 * (the exported handler it composes) using jest.mock for all external deps.
 *
 * Key behaviours verified:
 *  - Streams all users and builds NotificationIntent for each
 *  - Dispatches in batches of 500
 *  - Flush final partial batch correctly
 *  - Correct type arg forwarded ('admin_push' vs 'admin_broadcast')
 */

// ─── Mocks MUST be declared before any imports ────────────────────────────────

jest.mock('../../models/User', () => ({
    __esModule: true,
    default: { find: jest.fn() },
}));

jest.mock('../../models/NotificationLog', () => ({
    __esModule: true,
    default: { create: jest.fn().mockResolvedValue({ _id: 'log-id' }) },
}));

jest.mock('../../models/Broadcast', () => ({
    __esModule: true,
    default: { create: jest.fn() },
}));

jest.mock('../../services/notification/NotificationDispatcher', () => ({
    NotificationDispatcher: { bulkDispatch: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../domain/NotificationIntent', () => ({
    NotificationIntent: {
        fromAdminBroadcast: jest.fn((userId, broadcastId, title, body, type) => ({
            userId, broadcastId, title, body, type,
        })),
    },
}));

jest.mock('../../utils/adminLogger', () => ({
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../validators/notificationValidators', () => ({
    validateNotificationContent: (_req: unknown, _res: unknown, next: () => void) => next(),
    validateAdminNotificationTarget: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import User from '../../models/User';
import { NotificationDispatcher } from '../../services/notification/NotificationDispatcher';
import { NotificationIntent } from '../../domain/NotificationIntent';
import { sendNotification } from '../../controllers/admin/adminNotificationController';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockedUser = User as unknown as { find: jest.Mock };
const mockedDispatcher = NotificationDispatcher as unknown as { bulkDispatch: jest.Mock };
const mockedIntent = NotificationIntent as unknown as { fromAdminBroadcast: jest.Mock };

/** Build a minimal Express-like req with admin user and notification body. */
const makeReq = (body: Record<string, unknown> = {}) => ({
    user: {
        _id: 'admin-id',
        role: 'super_admin',
        permissions: { notifications: { update: true } },
    },
    body: { title: 'Test', body: 'Hello', targetType: 'all', ...body },
    headers: {},
    ip: '127.0.0.1',
    originalUrl: '/api/v1/admin/notifications/send',
});

/** Minimal Express-like res spy. */
const makeRes = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    return res;
};

/** Build an async cursor from a static list of user-like objects. */
function makeCursor(users: Array<{ _id: string }>) {
    return {
        [Symbol.asyncIterator]: async function* () {
            for (const u of users) yield u;
        },
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('dispatchToAllUsers (via sendNotification targetType=all)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('builds one intent per user and dispatches them', async () => {
        const users = [{ _id: 'u1' }, { _id: 'u2' }, { _id: 'u3' }];
        mockedUser.find.mockReturnValue({ select: () => ({ cursor: () => makeCursor(users) }) });

        const req = makeReq() as any;
        const res = makeRes() as any;

        const [, , handler] = sendNotification as unknown as Array<(req: any, res: any) => Promise<void>>;
        await handler(req, res);

        expect(mockedIntent.fromAdminBroadcast).toHaveBeenCalledTimes(3);
        expect(mockedDispatcher.bulkDispatch).toHaveBeenCalledTimes(1);
        expect(mockedDispatcher.bulkDispatch.mock.calls[0][0]).toHaveLength(3);
    });

    it('dispatches in batches of 500 and flushes the remainder', async () => {
        // 1200 users → 2 full batches of 500 + 1 batch of 200
        const users = Array.from({ length: 1200 }, (_, i) => ({ _id: `u${i}` }));
        mockedUser.find.mockReturnValue({ select: () => ({ cursor: () => makeCursor(users) }) });

        const req = makeReq() as any;
        const res = makeRes() as any;

        const [, , handler] = sendNotification as unknown as Array<(req: any, res: any) => Promise<void>>;
        await handler(req, res);

        expect(mockedDispatcher.bulkDispatch).toHaveBeenCalledTimes(3);
        expect(mockedDispatcher.bulkDispatch.mock.calls[0][0]).toHaveLength(500);
        expect(mockedDispatcher.bulkDispatch.mock.calls[1][0]).toHaveLength(500);
        expect(mockedDispatcher.bulkDispatch.mock.calls[2][0]).toHaveLength(200);
    });

    it('does not call bulkDispatch when there are no users', async () => {
        mockedUser.find.mockReturnValue({ select: () => ({ cursor: () => makeCursor([]) }) });

        const req = makeReq() as any;
        const res = makeRes() as any;

        const [, , handler] = sendNotification as unknown as Array<(req: any, res: any) => Promise<void>>;
        await handler(req, res);

        expect(mockedDispatcher.bulkDispatch).not.toHaveBeenCalled();
    });

    it('uses admin_push type for targetType=all', async () => {
        const users = [{ _id: 'u1' }];
        mockedUser.find.mockReturnValue({ select: () => ({ cursor: () => makeCursor(users) }) });

        const req = makeReq({ targetType: 'all' }) as any;
        const res = makeRes() as any;

        const [, , handler] = sendNotification as unknown as Array<(req: any, res: any) => Promise<void>>;
        await handler(req, res);

        expect(mockedIntent.fromAdminBroadcast).toHaveBeenCalledWith(
            'u1',
            expect.any(String),
            'Test',
            'Hello',
            'admin_push'
        );
    });

    it('returns 400 when targetType=users but userIds is empty', async () => {
        const req = makeReq({ targetType: 'users', userIds: [] }) as any;
        const res = makeRes() as any;

        const [, , handler] = sendNotification as unknown as Array<(req: any, res: any) => Promise<void>>;
        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
