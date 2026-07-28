import { Request, Response, NextFunction } from 'express';
import {
    requireBusinessApproved,
    requireVerifiedBusiness,
    requireVerifiedBusinessForServiceParts,
} from '../../middleware/businessMiddleware';
import Business from '@esparex/core/models/Business';
import { LISTING_TYPE } from '@esparex/contracts';

jest.mock('@esparex/core/models/Business', () => ({
    findOne: jest.fn(),
}));

jest.mock('@esparex/core/utils/logger', () => ({
    __esModule: true,
    default: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
    },
}));

const mockBusinessFindOne = Business.findOne as jest.Mock;

describe('businessMiddleware — API Authorization Security Matrix', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    describe('requireBusinessApproved', () => {
        it('returns 401 Unauthorized when req.user is absent', async () => {
            await requireBusinessApproved(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('returns 403 Forbidden when no business exists for user', async () => {
            mockReq.user = { _id: 'user_123' } as unknown as Express.User;
            mockBusinessFindOne.mockResolvedValue(null);

            await requireBusinessApproved(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('returns 403 Forbidden when business status is pending', async () => {
            mockReq.user = { _id: 'user_123' } as unknown as Express.User;
            mockBusinessFindOne.mockResolvedValue({ status: 'pending' });

            await requireBusinessApproved(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('calls next() and attaches req.business when business status is live', async () => {
            mockReq.user = { _id: 'user_123' } as unknown as Express.User;
            const liveBusiness = { _id: 'biz_123', status: 'live' };
            mockBusinessFindOne.mockResolvedValue(liveBusiness);

            await requireBusinessApproved(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.business).toBe(liveBusiness);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('requireVerifiedBusiness', () => {
        it('returns 401 Unauthorized when req.user is absent', async () => {
            await requireVerifiedBusiness(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('returns 403 BUSINESS_NOT_VERIFIED when user has no verified business status', async () => {
            mockReq.user = { _id: 'user_123', id: 'user_123' } as unknown as Express.User;
            mockBusinessFindOne.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null),
                }),
            });

            await requireVerifiedBusiness(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('calls next() when user has live business status', async () => {
            mockReq.user = { _id: 'user_123', id: 'user_123', businessStatus: 'live' } as unknown as Express.User;

            await requireVerifiedBusiness(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('requireVerifiedBusinessForServiceParts', () => {
        it('skips verification for standard consumer ad listings', async () => {
            mockReq.body = { listingType: LISTING_TYPE.AD };

            await requireVerifiedBusinessForServiceParts(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockBusinessFindOne).not.toHaveBeenCalled();
        });

        it('enforces verification when creating service listings', async () => {
            mockReq.user = { _id: 'user_123', id: 'user_123' } as unknown as Express.User;
            mockReq.body = { listingType: LISTING_TYPE.SERVICE };

            mockBusinessFindOne.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ status: 'pending' }),
                }),
            });

            await requireVerifiedBusinessForServiceParts(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('enforces verification when creating spare_part listings', async () => {
            mockReq.user = { _id: 'user_123', id: 'user_123' } as unknown as Express.User;
            mockReq.body = { listingType: LISTING_TYPE.SPARE_PART };

            mockBusinessFindOne.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ status: 'live' }),
                }),
            });

            await requireVerifiedBusinessForServiceParts(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});
