const mockGetAndVerifyOwnedListing = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();

jest.mock('@esparex/core/utils/controllerUtils', () => ({
    getAndVerifyOwnedListing: (...args: unknown[]) => mockGetAndVerifyOwnedListing(...args),
}));

jest.mock('@esparex/core/utils/respond', () => ({
    sendSuccessResponse: (...args: unknown[]) => mockSendSuccessResponse(...args),
}));

jest.mock('@esparex/core/utils/errorResponse', () => ({
    sendErrorResponse: (...args: unknown[]) => mockSendErrorResponse(...args),
}));

import type { Request, Response, NextFunction } from 'express';
import { markListingStatusSold } from '../../controllers/listing/lifecycle.controller';

const LISTING_ID = '65f0a1b2c3d4e5f6a7b8c9d0';

describe('lifecycle.controller — markListingStatusSold', () => {
    let mockSave: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSave = jest.fn().mockResolvedValue(true);
    });

    const createMockListing = (status: string, isSold = false) => ({
        _id: LISTING_ID,
        status,
        isSold,
        soldAt: undefined as Date | undefined,
        save: mockSave,
    });

    it('returns early when listing not found or not owned', async () => {
        mockGetAndVerifyOwnedListing.mockResolvedValue(null);
        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(mockSave).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when listing is not expired', async () => {
        const listing = createMockListing('live');
        mockGetAndVerifyOwnedListing.mockResolvedValue(listing);
        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400, 'Listing must be expired to be marked as sold under this endpoint'
        );
        expect(mockSave).not.toHaveBeenCalled();
    });

    it('returns 400 when listing is already marked as sold', async () => {
        const listing = createMockListing('expired', true);
        mockGetAndVerifyOwnedListing.mockResolvedValue(listing);
        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400, 'Listing is already marked as sold'
        );
        expect(mockSave).not.toHaveBeenCalled();
    });

    it('marks listing as sold and saves successfully', async () => {
        const listing = createMockListing('expired', false);
        mockGetAndVerifyOwnedListing.mockResolvedValue(listing);
        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(listing.isSold).toBe(true);
        expect(listing.soldAt).toBeInstanceOf(Date);
        expect(mockSave).toHaveBeenCalled();
        expect(mockSendSuccessResponse).toHaveBeenCalledWith(
            res, listing, 'Listing marked as sold successfully'
        );
    });

    it('passes errors to next() middleware on failure', async () => {
        const listing = createMockListing('expired', false);
        const dbError = new Error('Database save failure');
        mockSave.mockRejectedValue(dbError);
        mockGetAndVerifyOwnedListing.mockResolvedValue(listing);

        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await markListingStatusSold(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
    });
});
