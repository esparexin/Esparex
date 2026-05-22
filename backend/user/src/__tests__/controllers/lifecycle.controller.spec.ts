/**
 * Unit tests for lifecycle.controller.ts — uncovered functions
 *
 * Existing coverage (from ported specs):
 *   ✅ repostListing  — listingRepost.spec.ts
 *   ✅ deactivateListing — requireOwnedService.spec.ts
 *
 * New coverage here:
 *   markListingSold  (4 cases)
 *   deleteListing    (3 cases)
 *   promoteListing   (5 cases)
 */

// ─── Mocks (MUST be declared before any imports) ─────────────────────────────

const mockGetAndVerifyOwnedListing = jest.fn();
const mockMutateStatus = jest.fn();
const mockCanPromote = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();

jest.mock('@esparex/core/utils/controllerUtils', () => ({
    getAndVerifyOwnedListing: (...args: unknown[]) => mockGetAndVerifyOwnedListing(...args),
}));

jest.mock('@esparex/core/services/StatusMutationService', () => ({
    mutateStatus: (...args: unknown[]) => mockMutateStatus(...args),
}));

jest.mock('@esparex/core/services/AdMutationService', () => ({
    repostAd: jest.fn(),
}));

jest.mock('@esparex/core/services/PromotionPolicyService', () => ({
    PromotionPolicyService: {
        canPromote: (...args: unknown[]) => mockCanPromote(...args),
    },
}));

jest.mock('@esparex/core/utils/respond', () => ({
    sendSuccessResponse: (...args: unknown[]) => mockSendSuccessResponse(...args),
}));

jest.mock('@esparex/core/utils/errorResponse', () => ({
    sendErrorResponse: (...args: unknown[]) => mockSendErrorResponse(...args),
}));

const mockListingStatus = { LIVE: 'live', SOLD: 'sold', PENDING: 'pending', DRAFT: 'draft', DELETED: 'deleted' };

jest.mock('@esparex/shared/enums/listingStatus', () => ({
    LISTING_STATUS: mockListingStatus,
    LISTING_STATUS_VALUES: Object.values(mockListingStatus),
}));

jest.mock('@shared/enums/actor', () => ({
    ACTOR_TYPE: { USER: 'USER', ADMIN: 'ADMIN' },
}));

jest.mock('@esparex/core/utils/requestParams', () => ({
    getSingleParam: jest.fn(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import {
    markListingSold,
    deleteListing,
    promoteListing,
} from '../../controllers/listing/lifecycle.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = '65f0a1b2c3d4e5f6a7b8c9d1';
const LISTING_ID = '65f0a1b2c3d4e5f6a7b8c9d0';

const makeReq = (overrides: Partial<{
    user: unknown;
    body: Record<string, unknown>;
    params: Record<string, string>;
    headers: Record<string, string>;
    ip: string;
    listing: unknown;
}> = {}): Request => ({
    user: { _id: USER_ID, role: 'user' },
    body: {},
    params: { id: LISTING_ID },
    headers: { 'user-agent': 'TestAgent/1.0' },
    ip: '127.0.0.1',
    listing: { _id: LISTING_ID, status: 'live', listingType: 'ad' },
    ...overrides,
} as unknown as Request);

const makeRes = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
};

const makeNext = (): NextFunction => jest.fn();

const liveListing = () => ({ _id: LISTING_ID, status: 'live', listingType: 'ad' });

// ─── markListingSold ──────────────────────────────────────────────────────────

describe('lifecycle.controller — markListingSold', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockMutateStatus.mockResolvedValue({ _id: LISTING_ID, status: 'sold' });
    });

    it('returns early when listing not found or not owned', async () => {
        const req = makeReq({ listing: null });
        const res = makeRes();
        const next = makeNext();

        await markListingSold(req, res, next);

        expect(mockMutateStatus).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when listing is not LIVE', async () => {
        const req = makeReq({ listing: { _id: LISTING_ID, status: 'draft' } });
        const res = makeRes();
        const next = makeNext();

        await markListingSold(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400, 'Only live listings can be marked as sold'
        );
        expect(mockMutateStatus).not.toHaveBeenCalled();
    });

    it('calls mutateStatus with SOLD and correct actor context', async () => {
        const req = makeReq({ body: { soldReason: 'sold_on_platform' } });
        const res = makeRes();
        const next = makeNext();

        await markListingSold(req, res, next);

        expect(mockMutateStatus).toHaveBeenCalledWith(
            expect.objectContaining({
                domain: 'ad',
                entityId: LISTING_ID,
                toStatus: 'sold',
                actor: expect.objectContaining({ type: 'USER', id: USER_ID }),
                reason: 'sold_on_platform',
                patch: expect.objectContaining({ soldReason: 'sold_on_platform', isChatLocked: true }),
            })
        );
        expect(mockSendSuccessResponse).toHaveBeenCalledWith(
            res, { _id: LISTING_ID, status: 'sold' }, 'Listing marked as sold'
        );
    });

    it('forwards mutateStatus errors to next()', async () => {
        const error = new Error('DB write failed');
        mockMutateStatus.mockRejectedValue(error);
        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await markListingSold(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(mockSendSuccessResponse).not.toHaveBeenCalled();
    });
});

// ─── deleteListing ────────────────────────────────────────────────────────────

describe('lifecycle.controller — deleteListing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockMutateStatus.mockResolvedValue({ _id: LISTING_ID, isDeleted: true });
    });

    it('returns early when listing not found or not owned', async () => {
        const req = makeReq({ listing: null });
        const res = makeRes();
        const next = makeNext();

        await deleteListing(req, res, next);

        expect(mockMutateStatus).not.toHaveBeenCalled();
    });

    it('calls mutateStatus with isDeleted patch and responds 204', async () => {
        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await deleteListing(req, res, next);

        expect(mockMutateStatus).toHaveBeenCalledWith(
            expect.objectContaining({
                domain: 'ad',
                entityId: LISTING_ID,
                toStatus: 'deleted',
                patch: expect.objectContaining({ isDeleted: true, isChatLocked: true }),
            })
        );
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
    });

    it('forwards mutateStatus errors to next()', async () => {
        const error = new Error('Constraint violation');
        mockMutateStatus.mockRejectedValue(error);
        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await deleteListing(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

// ─── promoteListing ───────────────────────────────────────────────────────────

describe('lifecycle.controller — promoteListing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCanPromote.mockReturnValue({ allowed: true });
    });

    it('returns early when listing not found or not owned', async () => {
        const req = makeReq({ listing: null });
        const res = makeRes();
        const next = makeNext();

        await promoteListing(req, res, next);

        expect(mockCanPromote).not.toHaveBeenCalled();
        expect(mockSendSuccessResponse).not.toHaveBeenCalled();
    });

    it('returns 403 when PromotionPolicyService.canPromote rejects', async () => {
        mockCanPromote.mockReturnValue({
            allowed: false,
            reason: 'Services cannot be promoted via spotlight',
            code: 'PROMOTION_TYPE_NOT_ALLOWED',
        });
        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await promoteListing(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 403,
            'Services cannot be promoted via spotlight',
            { code: 'PROMOTION_TYPE_NOT_ALLOWED' }
        );
        expect(mockSendSuccessResponse).not.toHaveBeenCalled();
    });

    it('returns 400 when listing is not LIVE (even if policy allows)', async () => {
        mockCanPromote.mockReturnValue({ allowed: true });
        const req = makeReq({ listing: { _id: LISTING_ID, status: 'draft', listingType: 'ad' } });
        const res = makeRes();
        const next = makeNext();

        await promoteListing(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 400, 'Only live listings can be promoted');
    });

    it('returns promotion checkout payload when policy allows and listing is LIVE', async () => {
        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await promoteListing(req, res, next);

        expect(mockSendSuccessResponse).toHaveBeenCalledWith(
            res,
            expect.objectContaining({
                listingId: LISTING_ID,
                currentStatus: 'live',
                listingType: 'ad',
            }),
            'Proceed to promotion checkout'
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next()', async () => {
        const error = new Error('Unexpected');
        mockCanPromote.mockImplementation(() => { throw error; });
        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await promoteListing(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
