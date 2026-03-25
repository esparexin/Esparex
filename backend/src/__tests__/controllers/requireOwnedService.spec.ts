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
    getSingleParam: jest.fn((req: any, _res: any, key: string) => req.params?.[key] ?? ''),
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../utils/respond', () => ({
    respond: jest.fn((v: unknown) => v),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

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
        // Default: getSingleParam returns the valid ID from params
        mockedGetSingleParam.mockImplementation(
            (req: any, _res: any, key: string) => req.params?.[key] ?? ''
        );
    });

    it('returns 401 when req.user is absent', async () => {
        const req = makeReq({ user: undefined }) as any;
        const res = makeRes() as any;

        await deactivateService(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when :id is missing', async () => {
        // getSingleParam returns empty string → helper sends 400
        mockedGetSingleParam.mockReturnValue('');
        const req = makeReq({ params: { id: '' } }) as any;
        const res = makeRes() as any;

        await deactivateService(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for a non-ObjectId :id string', async () => {
        mockedGetSingleParam.mockReturnValue('not-an-objectid');
        const req = makeReq({ params: { id: 'not-an-objectid' } }) as any;
        const res = makeRes() as any;

        await deactivateService(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when Ad.findOne returns null (service not found or wrong owner)', async () => {
        mockedAd.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        const req = makeReq() as any;
        const res = makeRes() as any;

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

        const req = makeReq() as any;
        const res = makeRes() as any;

        await deactivateService(req, res);

        // mutateStatus was called → auth guard passed
        const { mutateStatus } = require('../../services/StatusMutationService');
        expect(mutateStatus).toHaveBeenCalledWith(
            expect.objectContaining({ entityId: VALID_ID, toStatus: 'deactivated' })
        );
    });
});
