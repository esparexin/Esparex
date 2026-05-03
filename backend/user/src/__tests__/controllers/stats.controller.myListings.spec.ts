const mockGetOwnerListings = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();
const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};

jest.mock('@core/services/ad/AdAggregationService', () => ({
    getOwnerListings: mockGetOwnerListings,
}));

jest.mock('@core/utils/respond', () => ({
    sendSuccessResponse: mockSendSuccessResponse,
}));

jest.mock('@core/utils/errorResponse', () => ({
    sendErrorResponse: mockSendErrorResponse,
}));

jest.mock('@core/utils/logger', () => ({
    __esModule: true,
    default: mockLogger,
}));

import type { Request, Response } from 'express';
import { getMyListings } from '../../controllers/listing/stats.controller';

describe('stats.controller getMyListings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('delegates to AdAggregationService.getOwnerListings with correct query and pagination', async () => {
        const mockResult = {
            items: [{ _id: 'listing-1' }],
            total: 1
        };
        mockGetOwnerListings.mockResolvedValue(mockResult);

        const req = {
            user: { _id: 'seller-1' },
            query: { type: 'ad', status: 'live', page: '2', limit: '5' },
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyListings(req, res);

        expect(mockGetOwnerListings).toHaveBeenCalledWith(
            expect.objectContaining({
                sellerId: 'seller-1',
                isDeleted: { $ne: true },
                status: expect.any(Object), // statusQueryMapper result
            }),
            2,
            5
        );

        expect(mockSendSuccessResponse).toHaveBeenCalledWith(
            res,
            {
                items: mockResult.items,
                pagination: {
                    total: 1,
                    page: 2,
                    limit: 5,
                    hasMore: false,
                },
            }
        );
    });

    it('logs the failure before returning a 500 response', async () => {
        const failure = new Error('Database disconnected');
        mockGetOwnerListings.mockRejectedValue(failure);

        const req = {
            user: { _id: 'seller-9', toString: () => 'seller-9' },
            query: { type: 'ad', status: 'live' },
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyListings(req, res);

        expect(mockLogger.error).toHaveBeenCalledWith(
            'Failed to fetch owner listings',
            { error: failure }
        );
        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 500, 'Failed to fetch your listings');
    });
});

