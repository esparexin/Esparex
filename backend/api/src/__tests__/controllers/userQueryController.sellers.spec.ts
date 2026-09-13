/**
 * Unit tests for getPublicSellers controller.
 * Verifies public seller directory endpoint behavior for sitemap & SEO indexing.
 */

// ─── Mocks MUST be declared before any imports ───────────────────────────────

jest.mock('@esparex/core/domains/identity/application/users/UserProfileService', () => ({
    getUserProfileById: jest.fn(),
    getPublicSellers: jest.fn(),
}));

jest.mock('../../utils/respond', () => ({
    respond: jest.fn((v: unknown) => v),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import type { Request, Response } from 'express';
import { getPublicSellers } from '../../controllers/user/userQueryController';
import { getPublicSellers as getPublicSellersSvc } from '@esparex/core/domains/identity/application/users/UserProfileService';

// ─── Typed mock ──────────────────────────────────────────────────────────────

const mockedGetPublicSellers = getPublicSellersSvc as jest.Mock;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeReq = (query: Record<string, string> = {}): Partial<Request> => ({
    query,
    headers: {},
    ip: '127.0.0.1',
});

const makeRes = (): Partial<Response> => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
});

const makeNext = () => jest.fn();

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getPublicSellers controller', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 200 with items and total when sellers exist', async () => {
        const fakeResult = {
            items: [
                { id: 'user-1', name: 'John Doe', slug: 'john-doe', status: 'active' },
                { id: 'user-2', name: 'Jane Smith', slug: 'jane-smith', status: 'active' },
            ],
            total: 2,
        };
        mockedGetPublicSellers.mockResolvedValueOnce(fakeResult);

        const req = makeReq({ limit: '10', page: '1' });
        const res = makeRes();
        const next = makeNext();

        await getPublicSellers(req as Request, res as Response, next);

        expect(mockedGetPublicSellers).toHaveBeenCalledWith({ limit: 10, page: 1 });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: fakeResult,
            })
        );
    });

    it('defaults pagination when query params are missing or invalid', async () => {
        mockedGetPublicSellers.mockResolvedValueOnce({ items: [], total: 0 });

        const req = makeReq({});
        const res = makeRes();
        const next = makeNext();

        await getPublicSellers(req as Request, res as Response, next);

        expect(mockedGetPublicSellers).toHaveBeenCalledWith({ limit: 100, page: 1 });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: { items: [], total: 0 },
            })
        );
    });

    it('clamps limit to maximum of 1000', async () => {
        mockedGetPublicSellers.mockResolvedValueOnce({ items: [], total: 0 });

        const req = makeReq({ limit: '5000', page: '2' });
        const res = makeRes();
        const next = makeNext();

        await getPublicSellers(req as Request, res as Response, next);

        expect(mockedGetPublicSellers).toHaveBeenCalledWith({ limit: 1000, page: 2 });
    });

    it('passes error to next when service throws', async () => {
        const error = new Error('Database query failed');
        mockedGetPublicSellers.mockRejectedValueOnce(error);

        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await getPublicSellers(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
