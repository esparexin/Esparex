/**
 * Unit tests for resolveUserId (Phase 9).
 *
 * Module-private helper — tested indirectly via getUserProfileById
 * (the exported endpoint that calls resolveUserId first).
 *
 * Scenarios:
 *  - Missing :id → 400
 *  - Valid :id → passed through to service layer
 *  - Service returns null profile → 404
 *  - Service returns profile → 200 with data
 */

// ─── Mocks MUST be declared before any imports ───────────────────────────────

jest.mock('../../services/UserProfileService', () => ({
    getUserProfileById: jest.fn(),
}));

jest.mock('../../utils/respond', () => ({
    respond: jest.fn((v: unknown) => v),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import type { Request, Response } from 'express';
import { getUserProfileById } from '../../controllers/user/userQueryController';
import { getUserProfileById as getUserProfileSvc } from '../../services/UserProfileService';

// ─── Typed mock ──────────────────────────────────────────────────────────────

const mockedService = getUserProfileSvc as jest.Mock;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeReq = (id: string) => ({
    params: { id },
    headers: {},
    ip: '127.0.0.1',
});

const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
});

const makeNext = () => jest.fn();

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('resolveUserId (via getUserProfileById)', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 400 and does NOT call the service when :id is empty', async () => {
        const req = makeReq('') as unknown as Request;
        const res = makeRes() as unknown as Response;
        const next = makeNext();

        await getUserProfileById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockedService).not.toHaveBeenCalled();
    });

    it('calls the service with the resolved userId when :id is present', async () => {
        mockedService.mockResolvedValueOnce({ userId: 'abc', displayName: 'Alice' });

        const req = makeReq('abc') as unknown as Request;
        const res = makeRes() as unknown as Response;
        const next = makeNext();

        await getUserProfileById(req, res, next);

        expect(mockedService).toHaveBeenCalledWith('abc');
    });

    it('returns 404 when service returns null profile', async () => {
        mockedService.mockResolvedValueOnce(null);

        const req = makeReq('user-xyz') as unknown as Request;
        const res = makeRes() as unknown as Response;
        const next = makeNext();

        await getUserProfileById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with profile data on success', async () => {
        const fakeProfile = { userId: 'user-xyz', displayName: 'Bob' };
        mockedService.mockResolvedValueOnce(fakeProfile);

        const req = makeReq('user-xyz') as unknown as Request;
        const res = makeRes() as unknown as Response;
        const next = makeNext();

        await getUserProfileById(req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ data: fakeProfile, success: true })
        );
    });

    it('calls next(error) when the service throws', async () => {
        const boom = new Error('DB error');
        mockedService.mockRejectedValueOnce(boom);

        const req = makeReq('user-xyz') as unknown as Request;
        const res = makeRes() as unknown as Response;
        const next = makeNext();

        await getUserProfileById(req, res, next);

        expect(next).toHaveBeenCalledWith(boom);
    });
});
