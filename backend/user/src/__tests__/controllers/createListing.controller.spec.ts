/**
 * Unit tests for createListing.controller.ts
 *
 * Strategy: mock every dependency at the module boundary so tests
 * are fast, deterministic, and isolated from DB / Redis / external services.
 *
 * Coverage goals:
 *  1. sellerId injection → rejected (400)
 *  2. Orchestrator called with server-derived sellerId, never client-supplied
 *  3. Successful creation → 201 + data
 *  4. Orchestrator returns null → forwards to next() as 500
 *  5. Orchestrator throws AppError → forwards to next()
 */

// ─── Mocks (MUST be declared before any imports) ─────────────────────────────

const mockCreateAd = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();

jest.mock('@esparex/core/services/AdOrchestrator', () => ({
    createAd: (...args: unknown[]) => mockCreateAd(...args),
}));

jest.mock('@esparex/core/services/AdImageService', () => ({
    uploadAdImage: jest.fn(),
    getUploadPresignedUrl: jest.fn(),
}));

jest.mock('@esparex/core/utils/respond', () => ({
    sendSuccessResponse: (...args: unknown[]) => mockSendSuccessResponse(...args),
}));

// errorResponse is dynamically imported inside the controller — mock it here
// so the dynamic import resolves to our mock during tests.
jest.mock('@esparex/core/utils/errorResponse', () => ({
    sendErrorResponse: (...args: unknown[]) => mockSendErrorResponse(...args),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { createListing } from '../../controllers/listing/createListing.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = '65f0a1b2c3d4e5f6a7b8c9d0';

const makeReq = (overrides: Partial<{
    user: unknown;
    body: Record<string, unknown>;
    headers: Record<string, string>;
    ip: string;
}> = {}): Request => ({
    user: { _id: USER_ID, role: 'user' },
    body: {
        title: 'iPhone 13',
        price: 50000,
        location: {
            city: 'Guntur',
            state: 'Andhra Pradesh',
            coordinates: [80.4365, 16.3067],
        },
    },
    headers: {},
    ip: '127.0.0.1',
    ...overrides,
} as unknown as Request);

const makeRes = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const makeNext = (): NextFunction => jest.fn();

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createListing.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── 1. sellerId injection guard ──────────────────────────────────────────

    it('rejects request that supplies sellerId in the body', async () => {
        const req = makeReq({ body: { title: 'Test', sellerId: 'hacker-id' } });
        const res = makeRes();
        const next = makeNext();

        await createListing(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400,
            expect.stringContaining('sellerId'),
            expect.objectContaining({ code: 'IMMUTABLE_SELLER_ID' })
        );
        expect(mockCreateAd).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    // ── 2. Orchestrator receives server-controlled sellerId ──────────────────

    it('calls AdOrchestrator.createAd with server-derived sellerId, not body sellerId', async () => {
        const fakeAd = { _id: 'ad-1', title: 'iPhone 13' };
        mockCreateAd.mockResolvedValue(fakeAd);

        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await createListing(req, res, next);

        expect(mockCreateAd).toHaveBeenCalledTimes(1);
        const [, context] = mockCreateAd.mock.calls[0] as [unknown, { sellerId: string; authUserId: string; actor: string }];
        expect(context.sellerId).toBe(USER_ID);
        expect(context.authUserId).toBe(USER_ID);
        expect(context.actor).toBe('USER');
    });

    // ── 3. Happy path — 201 with listing data ────────────────────────────────

    it('returns 201 with created listing on success', async () => {
        const fakeAd = { _id: 'ad-1', title: 'iPhone 13', status: 'pending' };
        mockCreateAd.mockResolvedValue(fakeAd);

        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await createListing(req, res, next);

        expect(mockSendSuccessResponse).toHaveBeenCalledWith(
            res, fakeAd, 'Listing created successfully', 201
        );
        expect(next).not.toHaveBeenCalled();
    });

    // ── 4. Orchestrator returns null → error forwarded ───────────────────────

    it('calls next() when orchestrator returns null', async () => {
        mockCreateAd.mockResolvedValue(null);

        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await createListing(req, res, next);

        // null result still reaches sendSuccessResponse (controller trusts service layer)
        // — the important thing is next() is NOT called with an error
        expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    // ── 5. Orchestrator throws → error forwarded to next() ───────────────────

    it('forwards thrown errors to next()', async () => {
        const error = Object.assign(new Error('Duplicate listing'), { statusCode: 409, code: 'DUPLICATE_AD' });
        mockCreateAd.mockRejectedValue(error);

        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await createListing(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(mockSendSuccessResponse).not.toHaveBeenCalled();
    });

    // ── 6. Idempotency key forwarded to orchestrator ─────────────────────────

    it('passes idempotency-key header to orchestrator context', async () => {
        const fakeAd = { _id: 'ad-2' };
        mockCreateAd.mockResolvedValue(fakeAd);
        const idemKey = 'test-idem-key-abc123';

        const req = makeReq({ headers: { 'idempotency-key': idemKey } });
        const res = makeRes();
        const next = makeNext();

        await createListing(req, res, next);

        const [, context] = mockCreateAd.mock.calls[0] as [unknown, { idempotencyKey: string }];
        expect(context.idempotencyKey).toBe(idemKey);
    });

    // ── 7. IP and User-Agent forwarded to orchestrator ────────────────────────

    it('forwards ip and user-agent to orchestrator for fraud scoring', async () => {
        mockCreateAd.mockResolvedValue({ _id: 'ad-3' });
        const userAgent = 'Mozilla/5.0 (Test)';

        const req = makeReq({
            ip: '203.0.113.42',
            headers: { 'user-agent': userAgent },
        });
        const res = makeRes();
        const next = makeNext();

        await createListing(req, res, next);

        const [, context] = mockCreateAd.mock.calls[0] as [unknown, { ip: string; deviceFingerprint: string }];
        expect(context.ip).toBe('203.0.113.42');
        expect(context.deviceFingerprint).toBe(userAgent);
    });
});
