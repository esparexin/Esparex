/**
 * Repost controller tests
 * Verifies the unified repostListing controller.
 */

jest.mock('@esparex/core/services/AdMutationService', () => ({
    repostAd: jest.fn(),
}));

jest.mock('@esparex/core/services/lifecycle/StatusMutationService', () => ({
    mutateStatus: jest.fn(),
}));

jest.mock('../../utils/controllerUtils', () => ({
    getAndVerifyOwnedListing: jest.fn(),
}));

jest.mock('@esparex/core/services/PromotionPolicyService', () => ({
    PromotionPolicyService: {
        canPromote: jest.fn(),
    },
}));

jest.mock('../../utils/errorResponse', () => ({
    sendErrorResponse: jest.fn((req: unknown, res: { status: (n: number) => { json: (v: unknown) => void } }, status: number, msg: string) => {
        res.status(status).json({ error: msg });
        return res;
    }),
}));

jest.mock('../../utils/respond', () => ({
    sendSuccessResponse: jest.fn((res: { status: (n: number) => { json: (v: unknown) => void } }, data: unknown, msg: string) => {
        res.status(200).json({ data, message: msg });
        return res;
    }),
}));

jest.mock('../../utils/requestParams', () => ({
    getSingleParam: jest.fn((req: { params: Record<string, string> }, _res: unknown, param: string) => req.params[param]),
}));

import { Request, Response } from 'express';
import AdMutationService from '@esparex/core/services/AdMutationService';
import { getAndVerifyOwnedListing } from '../../utils/controllerUtils';
import { repostListing } from '../../controllers/listing/lifecycle.controller';

const mockedRepostAd = AdMutationService.repostAd as jest.Mock;
const mockedGetAndVerifyOwnedListing = getAndVerifyOwnedListing as jest.Mock;

const makeRes = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const makeReq = (overrides: Partial<Request> & { listing?: unknown } = {}): Request =>
    ({
        user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1', toString: () => '65f0a1b2c3d4e5f6a7b8c9d1' },
        params: { id: '65f0a1b2c3d4e5f6a7b8c9d0' },
        body: {},
        // Transitional compatibility during Listings migration. Remove _id once all controllers consume domain Listing.
        listing: { id: '65f0a1b2c3d4e5f6a7b8c9d0', _id: '65f0a1b2c3d4e5f6a7b8c9d0', status: 'expired' },
        ...overrides,
    } as unknown as Request);

beforeEach(() => {
    jest.clearAllMocks();
});

describe('repostListing', () => {
    it('returns 404 when listing not found or not owned', async () => {
        mockedRepostAd.mockResolvedValue(null);
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();
        
        await repostListing(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(mockedRepostAd).toHaveBeenCalledWith('65f0a1b2c3d4e5f6a7b8c9d0', '65f0a1b2c3d4e5f6a7b8c9d1');
    });

    it('returns 200 with reposted listing on success', async () => {
        const fakeAd = { _id: '65f0a1b2c3d4e5f6a7b8c9d0', status: 'pending' };
        mockedRepostAd.mockResolvedValue(fakeAd);
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();
        
        await repostListing(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: fakeAd, message: 'Listing reposted successfully' });
    });

    it('passes unknown errors to next()', async () => {
        const error = new Error('Database down');
        mockedRepostAd.mockRejectedValue(error);
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();
        
        await repostListing(req, res, next);
        
        expect(next).toHaveBeenCalledWith(error);
    });

    it('handles known AdMutationService status errors as 400', async () => {
        const error = new Error('Listing is live');
        (error as Error & { statusCode?: number }).statusCode = 400;
        mockedRepostAd.mockRejectedValue(error);
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();
        
        await repostListing(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
});
