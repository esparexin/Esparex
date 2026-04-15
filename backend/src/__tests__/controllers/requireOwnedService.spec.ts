/**
 * Unit tests for requireOwnedService (Phase 8).
 *
 * Module-private helper — tested indirectly via deactivateService
 * (the simplest exported endpoint that delegates auth to requireOwnedService).
 *
 * Scenarios:
 *  - No user on req → 401
 *  - Missing :id param → 400
 *  - Malformed (non-ObjectId) :id → 400
 *  - Service not found / not owned → 404
 *  - Valid ownership → proceeds to business logic
 */

// ─── Mocks MUST be declared before any imports ───────────────────────────────

jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: { findOne: jest.fn() },
}));

jest.mock('../../services/StatusMutationService', () => ({
    mutateStatus: jest.fn().mockResolvedValue({ _id: 'svc-id', status: 'deactivated' }),
}));

jest.mock('../../utils/requestParams', () => ({
    getSingleParam: jest.fn((req: { params?: Record<string, string> }, res: { status: (n: number) => { json: (v: unknown) => void } }, key: string, options: { error?: string } = {}) => {
        const val = req.params?.[key];
        if (!val && options?.error) {
            res.status(400).json({ error: options.error });
            return null;
        }
        return val ?? '';
    }),
}));

jest.mock('../../utils/errorResponse', () => ({
    sendErrorResponse: jest.fn((req: unknown, res: { status: (n: number) => { json: (v: unknown) => void } }, status: number, msg: string) => {
        res.status(status).json({ error: msg });
    }),
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../utils/respond', () => ({
    respond: jest.fn((v: unknown) => v),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Ad from '../../models/Ad';
import { deactivateService } from '../../controllers/service/serviceMutationController';
import { getSingleParam } from '../../utils/requestParams';

// ─── Typed mocks ─────────────────────────────────────────────────────────────

const mockedAd = Ad as unknown as { findOne: jest.Mock };
const mockedGetSingleParam = getSingleParam as jest.Mock;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_ID = new mongoose.Types.ObjectId().toHexString();

const makeReq = (overrides: Record<string, unknown> = {}) => ({
    user: { _id: 'user-id', role: 'user' },
    params: { id: VALID_ID },
    body: {},
    headers: {},
    ip: '127.0.0.1',
    ...overrides,
});

const makeRes = () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    return res;
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('requireOwnedService (via deactivateService)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: match real getSingleParam behavior including error side-effect
        mockedGetSingleParam.mockImplementation(
            (req: { params?: Record<string, string> }, res: { status: (n: number) => { json: (v: unknown) => void } }, key: string, options: { error?: string } = {}) => {
                const val = req.params?.[key];
                if (!val && options?.error) {
                    res.status(400).json({ error: options.error });
                    return null;
                }
                return val ?? '';
            }
        );
    });

    it('returns 401 when req.user is absent', async () => {
        const req = makeReq({ user: undefined }) as unknown as Request;
        const res = makeRes() as unknown as Response;

        await deactivateService(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when :id is missing', async () => {
        const req = makeReq({ params: { id: '' } }) as unknown as Request;
        const res = makeRes() as unknown as Response;

        await deactivateService(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for a non-ObjectId :id string', async () => {
        mockedGetSingleParam.mockReturnValue('not-an-objectid');
        const req = makeReq({ params: { id: 'not-an-objectid' } }) as unknown as Request;
        const res = makeRes() as unknown as Response;

        await deactivateService(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when Ad.findOne returns null (service not found or wrong owner)', async () => {
        mockedAd.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        const req = makeReq() as unknown as Request;
        const res = makeRes() as unknown as Response;

        await deactivateService(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(mockedAd.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ _id: expect.any(mongoose.Types.ObjectId) })
        );
    });

    it('proceeds past auth guard when service is found and owned', async () => {
        mockedAd.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: VALID_ID, status: 'live' }),
        });

        const req = makeReq() as unknown as Request;
        const res = makeRes() as unknown as Response;

        await deactivateService(req, res);

        // mutateStatus was called → auth guard passed
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- module state is mocked per test.
        const { mutateStatus } = require('../../services/StatusMutationService');
        expect(mutateStatus).toHaveBeenCalledWith(
            expect.objectContaining({ entityId: VALID_ID, toStatus: 'deactivated' })
        );
    });
});
