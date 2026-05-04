/**
 * Unit tests for editListing.controller.ts
 *
 * Coverage goals:
 *  1. Missing :id param → returns early (getSingleParam returns null)
 *  2. Listing not owned / not found → returns early (getAndVerifyOwnedListing returns null)
 *  3. Immutable field in body → 400 LOCKED_FIELDS
 *  4. location/locationId blocked when listing is LIVE
 *  5. location/locationId blocked when listing is PENDING
 *  6. location/locationId allowed when listing is DRAFT/REJECTED
 *  7. Happy path → updateAd called with server context, 200
 *  8. updateAd throws → forwarded to next()
 *  9. Multiple locked fields → all errors returned in one response
 */

// ─── Mocks (MUST be declared before any imports) ─────────────────────────────

const mockGetSingleParam = jest.fn();
const mockGetAndVerifyOwnedListing = jest.fn();
const mockCollectImmutableFieldErrors = jest.fn();
const mockHasOwnField = jest.fn();
const mockUpdateAd = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();

jest.mock('@esparex/core/utils/requestParams', () => ({
    getSingleParam: (...args: unknown[]) => mockGetSingleParam(...args),
}));

jest.mock('@esparex/core/utils/controllerUtils', () => ({
    getAndVerifyOwnedListing: (...args: unknown[]) => mockGetAndVerifyOwnedListing(...args),
}));

jest.mock('@esparex/core/utils/immutableFieldErrors', () => ({
    collectImmutableFieldErrors: (...args: unknown[]) => mockCollectImmutableFieldErrors(...args),
    hasOwnField: (obj: Record<string, unknown>, field: string) => mockHasOwnField(obj, field),
}));

jest.mock('@esparex/core/services/AdMutationService', () => ({
    updateAd: (...args: unknown[]) => mockUpdateAd(...args),
}));

jest.mock('@esparex/core/utils/respond', () => ({
    sendSuccessResponse: (...args: unknown[]) => mockSendSuccessResponse(...args),
}));

jest.mock('@esparex/core/utils/errorResponse', () => ({
    sendErrorResponse: (...args: unknown[]) => mockSendErrorResponse(...args),
}));

jest.mock('@shared/enums/listingStatus', () => ({
    LISTING_STATUS: { LIVE: 'live', PENDING: 'pending', DRAFT: 'draft', REJECTED: 'rejected' },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { editListing } from '../../controllers/listing/editListing.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = '65f0a1b2c3d4e5f6a7b8c9d1';
const LISTING_ID = '65f0a1b2c3d4e5f6a7b8c9d0';

const makeReq = (overrides: Partial<{
    user: unknown;
    body: Record<string, unknown>;
    params: Record<string, string>;
}> = {}): Request => ({
    user: { _id: USER_ID, role: 'user' },
    body: { title: 'Updated title', price: 45000 },
    params: { id: LISTING_ID },
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

describe('editListing.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: valid ID returned
        mockGetSingleParam.mockReturnValue(LISTING_ID);
        // Default: listing found and owned, status = draft
        mockGetAndVerifyOwnedListing.mockResolvedValue({ _id: LISTING_ID, status: 'draft', listingType: 'ad' });
        // Default: no immutable field violations
        mockCollectImmutableFieldErrors.mockReturnValue([]);
        // Default: hasOwnField returns false (no location fields)
        mockHasOwnField.mockReturnValue(false);
        // Default: updateAd succeeds
        mockUpdateAd.mockResolvedValue({ _id: LISTING_ID, title: 'Updated title' });
    });

    // ── 1. Missing ID ────────────────────────────────────────────────────────

    it('returns early when getSingleParam returns null (missing :id)', async () => {
        mockGetSingleParam.mockReturnValue(null);

        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await editListing(req, res, next);

        expect(mockGetAndVerifyOwnedListing).not.toHaveBeenCalled();
        expect(mockUpdateAd).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    // ── 2. Listing not owned / not found ────────────────────────────────────

    it('returns early when getAndVerifyOwnedListing returns null', async () => {
        mockGetAndVerifyOwnedListing.mockResolvedValue(null);

        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await editListing(req, res, next);

        expect(mockUpdateAd).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    // ── 3. Immutable field in body ───────────────────────────────────────────

    it('rejects body containing an immutable field with 400 LOCKED_FIELDS', async () => {
        const lockError = { field: 'sellerId', message: 'Seller cannot be changed while editing a listing.', code: 'IMMUTABLE_FIELD' };
        mockCollectImmutableFieldErrors.mockReturnValue([lockError]);

        const req = makeReq({ body: { title: 'New', sellerId: 'hacker' } });
        const res = makeRes();
        const next = makeNext();

        await editListing(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400, 'Validation failed',
            expect.objectContaining({ code: 'LOCKED_FIELDS', details: [lockError] })
        );
        expect(mockUpdateAd).not.toHaveBeenCalled();
    });

    // ── 4. Location blocked when LIVE ────────────────────────────────────────

    it('blocks location change when listing status is LIVE', async () => {
        mockGetAndVerifyOwnedListing.mockResolvedValue({ _id: LISTING_ID, status: 'live' });
        mockHasOwnField.mockImplementation((_obj: unknown, field: string) => field === 'location');

        const req = makeReq({ body: { location: { city: 'Mumbai' } } });
        const res = makeRes();
        const next = makeNext();

        await editListing(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400, 'Validation failed',
            expect.objectContaining({ code: 'LOCKED_FIELDS' })
        );
        expect(mockUpdateAd).not.toHaveBeenCalled();
    });

    // ── 5. Location blocked when PENDING ─────────────────────────────────────

    it('blocks locationId change when listing status is PENDING', async () => {
        mockGetAndVerifyOwnedListing.mockResolvedValue({ _id: LISTING_ID, status: 'pending' });
        mockHasOwnField.mockImplementation((_obj: unknown, field: string) => field === 'locationId');

        const req = makeReq({ body: { locationId: 'loc-123' } });
        const res = makeRes();
        const next = makeNext();

        await editListing(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400, 'Validation failed',
            expect.objectContaining({ code: 'LOCKED_FIELDS' })
        );
        expect(mockUpdateAd).not.toHaveBeenCalled();
    });

    // ── 6. Location allowed when DRAFT ───────────────────────────────────────

    it('allows location change when listing status is DRAFT', async () => {
        mockGetAndVerifyOwnedListing.mockResolvedValue({ _id: LISTING_ID, status: 'draft' });
        // hasOwnField returns true for location, but status is draft so guard skips
        mockHasOwnField.mockImplementation((_obj: unknown, field: string) => field === 'location');
        const updatedListing = { _id: LISTING_ID, location: { city: 'Delhi' } };
        mockUpdateAd.mockResolvedValue(updatedListing);

        const req = makeReq({ body: { location: { city: 'Delhi' } } });
        const res = makeRes();
        const next = makeNext();

        await editListing(req, res, next);

        expect(mockUpdateAd).toHaveBeenCalledTimes(1);
        expect(mockSendSuccessResponse).toHaveBeenCalledWith(res, updatedListing, 'Listing updated successfully');
    });

    // ── 7. Happy path ─────────────────────────────────────────────────────────

    it('calls updateAd with server-controlled context and returns 200', async () => {
        const updatedListing = { _id: LISTING_ID, title: 'Updated title' };
        mockUpdateAd.mockResolvedValue(updatedListing);

        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await editListing(req, res, next);

        expect(mockUpdateAd).toHaveBeenCalledWith(
            LISTING_ID,
            expect.objectContaining({ title: 'Updated title' }),
            expect.objectContaining({
                actor: 'USER',
                authUserId: USER_ID,
                sellerId: USER_ID,
            })
        );
        expect(mockSendSuccessResponse).toHaveBeenCalledWith(res, updatedListing, 'Listing updated successfully');
        expect(next).not.toHaveBeenCalled();
    });

    // ── 8. updateAd throws → forwarded to next() ────────────────────────────

    it('forwards updateAd errors to next()', async () => {
        const error = new Error('DB write failed');
        mockUpdateAd.mockRejectedValue(error);

        const req = makeReq();
        const res = makeRes();
        const next = makeNext();

        await editListing(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(mockSendSuccessResponse).not.toHaveBeenCalled();
    });

    // ── 9. Multiple locked fields → all errors in one response ───────────────

    it('returns all locked field errors in a single 400 response', async () => {
        const lockErrors = [
            { field: 'categoryId', message: 'Category cannot be changed while editing a listing.', code: 'IMMUTABLE_FIELD' },
            { field: 'brandId', message: 'Brand cannot be changed while editing a listing.', code: 'IMMUTABLE_FIELD' },
        ];
        mockCollectImmutableFieldErrors.mockReturnValue(lockErrors);

        const req = makeReq({ body: { categoryId: 'cat-1', brandId: 'brand-1', title: 'Test' } });
        const res = makeRes();
        const next = makeNext();

        await editListing(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledTimes(1);
        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 400, 'Validation failed',
            expect.objectContaining({ details: lockErrors })
        );
        expect(mockUpdateAd).not.toHaveBeenCalled();
    });
});
