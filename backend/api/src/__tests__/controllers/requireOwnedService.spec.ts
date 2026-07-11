/**
 * Unit tests for requireListingOwner middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { requireListingOwner } from '../../middleware/ownershipGuard';
import { getAndVerifyOwnedListing } from '../../utils/controllerUtils';

jest.mock('../../utils/controllerUtils', () => ({
    getAndVerifyOwnedListing: jest.fn(),
}));

const mockGetAndVerifyOwnedListing = getAndVerifyOwnedListing as jest.Mock;

describe('requireListingOwner middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('calls next() and populates req.listing when getAndVerifyOwnedListing succeeds', async () => {
        const mockListing = { _id: '123', title: 'Test ad' };
        mockGetAndVerifyOwnedListing.mockResolvedValue(mockListing);

        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await requireListingOwner(req, res, next);

        expect(mockGetAndVerifyOwnedListing).toHaveBeenCalledWith(req, res);
        expect(req.listing).toBe(mockListing);
        expect(next).toHaveBeenCalled();
    });

    it('returns early and does not call next() when getAndVerifyOwnedListing returns null', async () => {
        mockGetAndVerifyOwnedListing.mockResolvedValue(null);

        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn() as NextFunction;

        await requireListingOwner(req, res, next);

        expect(mockGetAndVerifyOwnedListing).toHaveBeenCalledWith(req, res);
        expect(req.listing).toBeUndefined();
        expect(next).not.toHaveBeenCalled();
    });
});
