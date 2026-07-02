const mockGetAndVerifyOwnedListing = jest.fn();
const mockMutateStatus = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();

jest.mock('@esparex/core/utils/controllerUtils', () => ({
    getAndVerifyOwnedListing: (...args: unknown[]) => mockGetAndVerifyOwnedListing(...args),
}));

jest.mock('@esparex/core/services/lifecycle/StatusMutationService', () => ({
    mutateStatus: (...args: unknown[]) => mockMutateStatus(...args),
}));

jest.mock('@esparex/core/utils/respond', () => ({
    sendSuccessResponse: (...args: unknown[]) => mockSendSuccessResponse(...args),
}));

jest.mock('@esparex/core/utils/errorResponse', () => ({
    sendErrorResponse: (...args: unknown[]) => mockSendErrorResponse(...args),
}));

const mockListingStatus = {
    LIVE: 'live',
    PENDING: 'pending',
    DRAFT: 'draft',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    SOLD: 'sold',
    DEACTIVATED: 'deactivated',
    DELETED: 'deleted',
};

jest.mock('@esparex/shared', () => {
    const original = jest.requireActual('@esparex/shared');
    return {
        ...original,
        LISTING_STATUS: mockListingStatus,
        LISTING_STATUS_VALUES: Object.values(mockListingStatus),
        ACTOR_TYPE: { USER: 'USER', ADMIN: 'ADMIN' },
    };
});

import type { Request, Response, NextFunction } from 'express';
import { markListingStatusSold } from '../../controllers/listing/lifecycle.controller';

const LISTING_ID = '65f0a1b2c3d4e5f6a7b8c9d0';
const USER_ID    = '65f0a1b2c3d4e5f6a7b8c9d1';

const makeReq = (overrides: Partial<{ user: unknown; body: Record<string, unknown>; params: Record<string, string>; listing: unknown }> = {}): Request =>
    ({
        user: { _id: USER_ID, role: 'user' },
        body: {},
        params: { id: LISTING_ID },
        listing: { _id: LISTING_ID, status: 'expired', isSold: false, listingType: 'ad' },
        ...overrides,
    } as unknown as Request);

describe('lifecycle.controller — markListingStatusSold', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockMutateStatus.mockResolvedValue({ _id: LISTING_ID, status: 'sold', isSold: true });
    });

    it('returns early when listing not found or not owned', async () => {
        const req = makeReq({ listing: null });
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(mockMutateStatus).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when listing is not expired', async () => {
        const req = makeReq({ listing: { _id: LISTING_ID, status: 'live', isSold: false } });
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400,
            'Only expired listings can be retrospectively marked as sold via this endpoint'
        );
        expect(mockMutateStatus).not.toHaveBeenCalled();
    });

    it('returns 400 when listing is already marked as sold', async () => {
        const req = makeReq({ listing: { _id: LISTING_ID, status: 'expired', isSold: true } });
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400, 'Listing is already marked as sold'
        );
        expect(mockMutateStatus).not.toHaveBeenCalled();
    });

    it('delegates to mutateStatus and responds with success', async () => {
        const result = { _id: LISTING_ID, status: 'sold', isSold: true };
        mockMutateStatus.mockResolvedValue(result);
        const req = makeReq();
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(mockMutateStatus).toHaveBeenCalledWith(
            expect.objectContaining({
                domain: 'ad',
                entityId: LISTING_ID,
                toStatus: 'sold',
                actor: expect.objectContaining({ type: 'USER', id: USER_ID }),
                patch: expect.objectContaining({ isSold: true, isChatLocked: true }),
            })
        );
        expect(mockSendSuccessResponse).toHaveBeenCalledWith(
            res, result, 'Listing marked as sold successfully'
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('passes errors to next() middleware on failure', async () => {
        const dbError = new Error('Database save failure');
        mockMutateStatus.mockRejectedValue(dbError);
        const req = makeReq();
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
    });
});
