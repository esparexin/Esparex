/**
 * Repost controller tests — repostService & repostSparePartListing
 *
 * Verifies:
 *  - 401 when unauthenticated
 *  - 404 when listing not found or not owned
 *  - 400 when status is not expired/rejected
 *  - 200 with mutateStatus called correctly on success
 */

jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../services/StatusMutationService', () => ({
    mutateStatus: jest.fn(),
}));

jest.mock('../../utils/errorResponse', () => ({
    sendErrorResponse: jest.fn((req: any, res: any, status: number, msg: string) => {
        res.status(status).json({ error: msg });
    }),
}));

jest.mock('../../utils/respond', () => ({
    respond: jest.fn((data: unknown) => data),
}));

jest.mock('../../utils/requestParams', () => ({
    getSingleParam: jest.fn((req: any, _res: any, param: string) => req.params[param]),
}));

import { Request, Response } from 'express';
import Ad from '../../models/Ad';
import { mutateStatus } from '../../services/StatusMutationService';
import { repostService } from '../../controllers/service/serviceMutationController';
import { repostSparePartListing } from '../../controllers/sparePartListingController';

const mockedAd = Ad as unknown as { findOne: jest.Mock };
const mockedMutate = mutateStatus as jest.Mock;

const makeRes = (): Response => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const makeReq = (overrides: Partial<Request> = {}): Request =>
    ({
        user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1', toString: () => '65f0a1b2c3d4e5f6a7b8c9d1' },
        params: { id: '65f0a1b2c3d4e5f6a7b8c9d0' },
        body: {},
        ...overrides,
    } as unknown as Request);

beforeEach(() => {
    jest.clearAllMocks();
});

describe('repostService', () => {
    it('returns 401 when unauthenticated', async () => {
        const req = makeReq({ user: undefined });
        const res = makeRes();
        await repostService(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 404 when service not found', async () => {
        mockedAd.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        const req = makeReq();
        const res = makeRes();
        await repostService(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when service is live (not repostable)', async () => {
        mockedAd.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ status: 'live' }) });
        const req = makeReq();
        const res = makeRes();
        await repostService(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockedMutate).not.toHaveBeenCalled();
    });

    it('calls mutateStatus with pending for expired service', async () => {
        mockedAd.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ status: 'expired' }) });
        mockedMutate.mockResolvedValue({ id: '65f0a1b2c3d4e5f6a7b8c9d0', status: 'pending' });
        const req = makeReq();
        const res = makeRes();
        await repostService(req, res);
        expect(mockedMutate).toHaveBeenCalledWith(
            expect.objectContaining({ domain: 'service', toStatus: 'pending' })
        );
        expect(res.json).toHaveBeenCalled();
    });

    it('calls mutateStatus with pending for rejected service', async () => {
        mockedAd.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ status: 'rejected' }) });
        mockedMutate.mockResolvedValue({ id: '65f0a1b2c3d4e5f6a7b8c9d0', status: 'pending' });
        const req = makeReq();
        const res = makeRes();
        await repostService(req, res);
        expect(mockedMutate).toHaveBeenCalledWith(
            expect.objectContaining({ domain: 'service', toStatus: 'pending' })
        );
    });
});

describe('repostSparePartListing', () => {
    it('returns 401 when unauthenticated', async () => {
        const req = makeReq({ user: undefined });
        const res = makeRes();
        await repostSparePartListing(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when spare part is live (not repostable)', async () => {
        mockedAd.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ status: 'live' }) });
        const req = makeReq();
        const res = makeRes();
        await repostSparePartListing(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockedMutate).not.toHaveBeenCalled();
    });

    it('calls mutateStatus with pending for expired spare part', async () => {
        mockedAd.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ status: 'expired' }) });
        mockedMutate.mockResolvedValue({ id: '65f0a1b2c3d4e5f6a7b8c9d0', status: 'pending' });
        const req = makeReq();
        const res = makeRes();
        await repostSparePartListing(req, res);
        expect(mockedMutate).toHaveBeenCalledWith(
            expect.objectContaining({ domain: 'spare_part_listing', toStatus: 'pending' })
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
