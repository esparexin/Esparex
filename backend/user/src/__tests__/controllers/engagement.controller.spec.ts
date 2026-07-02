/**
 * Unit tests for engagement.controller.ts
 *
 * Endpoints:
 *   GET /api/v1/listings/:id/view  → incrementListingView
 *   GET /api/v1/listings/:id/phone → getListingPhone
 *
 * Coverage goals:
 *
 * incrementListingView:
 *   1. Valid ObjectId → AdEngagementService.incrementAdViewByFilter called with _id filter
 *   2. Slug (non-ObjectId) → called with seoSlug filter
 *   3. Missing :id → early return
 *   4. Service result forwarded via sendSuccessResponse
 *   5. Service throws → forwarded to next()
 *
 * getListingPhone:
 *   6. Success → sendSuccessResponse with result
 *   7. error=HIDDEN → 403 PHONE_HIDDEN
 *   8. error=REQUEST_REQUIRED → 403 PHONE_REQUEST_REQUIRED
 *   9. error=Listing not found → 404
 *   10. Unknown error string → 404 with error message
 *   11. result is null → 404 fallback
 *   12. requester id forwarded from req.user._id
 *   13. ip and user-agent forwarded as metadata
 *   14. Service throws → forwarded to next()
 */

// ─── Mocks (MUST be declared before any imports) ─────────────────────────────

const mockGetSingleParam = jest.fn();
const mockIncrementAdViewByFilter = jest.fn();
const mockGetSellerPhone = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();

jest.mock('@esparex/core/utils/requestParams', () => ({
    getSingleParam: (...args: unknown[]) => mockGetSingleParam(...args),
}));

jest.mock('@esparex/core/services/AdEngagementService', () => ({
    incrementAdViewByFilter: (...args: unknown[]) => mockIncrementAdViewByFilter(...args),
}));

jest.mock('@esparex/core/services/ContactRevealService', () => ({
    getSellerPhone: (...args: unknown[]) => mockGetSellerPhone(...args),
}));

jest.mock('@esparex/core/utils/respond', () => ({
    sendSuccessResponse: (...args: unknown[]) => mockSendSuccessResponse(...args),
}));

jest.mock('@esparex/core/utils/errorResponse', () => ({
    sendErrorResponse: (...args: unknown[]) => mockSendErrorResponse(...args),
}));

jest.mock('../../middleware/authMiddleware', () => ({
    extractUser: jest.fn((_req: unknown, _res: unknown, next: () => void) => next()),
    protect: jest.fn((_req: unknown, _res: unknown, next: () => void) => next()),
}));



// ─── Imports ──────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { incrementListingView, getListingPhone } from '../../controllers/listing/engagement.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_OBJECT_ID = '65f0a1b2c3d4e5f6a7b8c9d0';
const USER_ID = '65f0a1b2c3d4e5f6a7b8c9d1';

const makeViewReq = (idOrSlug: string, userAgent = 'TestAgent/1.0'): Request => ({
    user: { _id: USER_ID },
    params: { id: idOrSlug },
    headers: { 'user-agent': userAgent },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
} as unknown as Request);

const makePhoneReq = (overrides: Partial<{
    user: unknown;
    params: Record<string, string>;
    headers: Record<string, string>;
    ip: string;
}> = {}): Request => ({
    user: { _id: USER_ID },
    params: { id: VALID_OBJECT_ID },
    headers: { 'user-agent': 'TestAgent/1.0' },
    ip: '203.0.113.5',
    socket: { remoteAddress: '203.0.113.5' },
    ...overrides,
} as unknown as Request);

const makeRes = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const makeNext = (): NextFunction => jest.fn();

// ─── incrementListingView ─────────────────────────────────────────────────────

describe('engagement.controller — incrementListingView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetSingleParam.mockReturnValue(VALID_OBJECT_ID);
        mockIncrementAdViewByFilter.mockResolvedValue({ views: 42 });
    });

    it('calls incrementAdViewByFilter with _id filter for a valid ObjectId', async () => {
        const req = makeViewReq(VALID_OBJECT_ID);
        const res = makeRes();
        const next = makeNext();

        await incrementListingView(req, res, next);

        expect(mockIncrementAdViewByFilter).toHaveBeenCalledWith({ _id: VALID_OBJECT_ID });
    });

    it('calls incrementAdViewByFilter with seoSlug filter for a slug string', async () => {
        const slug = 'iphone-13-pro-max-gold';
        mockGetSingleParam.mockReturnValue(slug);

        const req = makeViewReq(slug);
        const res = makeRes();
        const next = makeNext();

        await incrementListingView(req, res, next);

        expect(mockIncrementAdViewByFilter).toHaveBeenCalledWith({ seoSlug: slug });
    });

    it('returns early without calling service when getSingleParam returns null', async () => {
        mockGetSingleParam.mockReturnValue(null);

        const req = makeViewReq('');
        const res = makeRes();
        const next = makeNext();

        await incrementListingView(req, res, next);

        expect(mockIncrementAdViewByFilter).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it('forwards service result via sendSuccessResponse', async () => {
        const result = { views: 99, listing: { _id: VALID_OBJECT_ID } };
        mockIncrementAdViewByFilter.mockResolvedValue(result);

        const req = makeViewReq(VALID_OBJECT_ID);
        const res = makeRes();
        const next = makeNext();

        await incrementListingView(req, res, next);

        expect(mockSendSuccessResponse).toHaveBeenCalledWith(res, result);
        expect(next).not.toHaveBeenCalled();
    });

    it('forwards thrown errors to next()', async () => {
        const error = new Error('Redis unavailable');
        mockIncrementAdViewByFilter.mockRejectedValue(error);

        const req = makeViewReq(VALID_OBJECT_ID);
        const res = makeRes();
        const next = makeNext();

        await incrementListingView(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(mockSendSuccessResponse).not.toHaveBeenCalled();
    });
});

// ─── getListingPhone ──────────────────────────────────────────────────────────

describe('engagement.controller — getListingPhone', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetSingleParam.mockReturnValue(VALID_OBJECT_ID);
        mockGetSellerPhone.mockResolvedValue({ phone: '9876543210' });
    });

    it('returns phone data via sendSuccessResponse on success', async () => {
        const result = { phone: '9876543210', masked: false };
        mockGetSellerPhone.mockResolvedValue(result);

        const req = makePhoneReq();
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        expect(mockSendSuccessResponse).toHaveBeenCalledWith(res, result);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 PHONE_HIDDEN when seller hid their phone', async () => {
        mockGetSellerPhone.mockResolvedValue({ error: 'HIDDEN' });

        const req = makePhoneReq();
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 403,
            expect.stringContaining('not to share'),
            expect.objectContaining({ code: 'PHONE_HIDDEN' })
        );
        expect(mockSendSuccessResponse).not.toHaveBeenCalled();
    });

    it('returns 403 PHONE_REQUEST_REQUIRED when phone is request-only', async () => {
        mockGetSellerPhone.mockResolvedValue({ error: 'REQUEST_REQUIRED' });

        const req = makePhoneReq();
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(
            req, res, 403,
            expect.stringContaining('request only'),
            expect.objectContaining({ code: 'PHONE_REQUEST_REQUIRED' })
        );
    });

    it('returns 404 when listing is not found', async () => {
        mockGetSellerPhone.mockResolvedValue({ error: 'Listing not found' });

        const req = makePhoneReq();
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 404, 'Listing not found');
    });

    it('returns 404 with error message for any unknown error string', async () => {
        mockGetSellerPhone.mockResolvedValue({ error: 'Seller account suspended' });

        const req = makePhoneReq();
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 404, 'Seller account suspended');
    });

    it('returns 404 fallback when result is null', async () => {
        mockGetSellerPhone.mockResolvedValue(null);

        const req = makePhoneReq();
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 404, 'Phone number not found');
    });

    it('forwards requester id from req.user._id to getSellerPhone', async () => {
        const req = makePhoneReq({ user: { _id: 'requester-99' } });
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        expect(mockGetSellerPhone).toHaveBeenCalledWith(
            VALID_OBJECT_ID,
            'ad',
            'requester-99',
            expect.any(Object)
        );
    });

    it('forwards ip and user-agent as metadata to getSellerPhone', async () => {
        const req = makePhoneReq({
            ip: '10.0.0.1',
            headers: { 'user-agent': 'MobileApp/3.2' },
        });
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        const [, , , metadata] = mockGetSellerPhone.mock.calls[0] as [unknown, unknown, unknown, { ip: string; device: string }];
        expect(metadata.ip).toBe('10.0.0.1');
        expect(metadata.device).toBe('MobileApp/3.2');
    });

    it('forwards thrown errors to next()', async () => {
        const error = new Error('ContactRevealService down');
        mockGetSellerPhone.mockRejectedValue(error);

        const req = makePhoneReq();
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(mockSendSuccessResponse).not.toHaveBeenCalled();
    });

    it('returns early without calling service when getSingleParam returns null', async () => {
        mockGetSingleParam.mockReturnValue(null);

        const req = makePhoneReq();
        const res = makeRes();
        const next = makeNext();

        await getListingPhone(req, res, next);

        expect(mockGetSellerPhone).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });
});
