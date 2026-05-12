const mockGetOwnerListings = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();
const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};

// Setup Mocks
const mockAggregate = jest.fn();
jest.mock('@esparex/core/models/Ad', () => ({
    __esModule: true,
    default: {
        aggregate: (...args: any[]) => mockAggregate(...args),
    },
}));

jest.mock('@esparex/core/services/ad/AdAggregationService', () => ({
    getOwnerListings: mockGetOwnerListings,
}));

jest.mock('@esparex/core/utils/respond', () => ({
    sendSuccessResponse: mockSendSuccessResponse,
}));

jest.mock('@esparex/core/utils/errorResponse', () => ({
    sendErrorResponse: mockSendErrorResponse,
}));

jest.mock('@esparex/core/utils/logger', () => ({
    __esModule: true,
    default: mockLogger,
}));

import type { Request, Response } from 'express';
import { getMyListingStatusCounts, getMyTabListings } from '../../controllers/listing/stats.controller';

describe('stats.controller getMyListingStatusCounts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns status counts correctly aggregated', async () => {
        mockAggregate.mockResolvedValue([
            { _id: 'live', count: 2 },
            { _id: 'active', count: 1 },
            { _id: 'pending', count: 3 },
            { _id: 'expired', count: 1 },
            { _id: 'rejected', count: 1 },
        ]);

        const req = {
            user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1' },
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyListingStatusCounts(req, res);

        expect(mockAggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                {
                    $match: expect.objectContaining({
                        isDeleted: { $ne: true },
                    }),
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ])
        );

        expect(mockSendSuccessResponse).toHaveBeenCalledWith(
            res,
            {
                live: 3,   // 2 live + 1 active (no deactivated in mock data)
                pending: 3,
                expired: 1, // 1 expired only (rejected not counted, sold not in mock)
                total: 7,
            }
        );
    });

    it('returns 401 if user is not authenticated', async () => {
        const req = {
            user: undefined,
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyListingStatusCounts(req, res);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 401, 'Unauthorized');
    });

    it('returns 500 if aggregate fails', async () => {
        const error = new Error('Aggregation failed');
        mockAggregate.mockRejectedValue(error);

        const req = {
            user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1' },
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyListingStatusCounts(req, res);

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch my status counts', { error });
        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 500, 'Failed to fetch listing status counts');
    });
});

describe('stats.controller getMyTabListings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 if user is not authenticated', async () => {
        const req = {
            user: undefined,
            query: { tab: 'live' },
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyTabListings(req, res);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 401, 'Unauthorized');
    });

    it('queries for live tab correctly with status: active and live', async () => {
        mockGetOwnerListings.mockResolvedValue({ items: [], total: 0 });

        const req = {
            user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1' },
            query: { tab: 'live', page: '1', limit: '10' },
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyTabListings(req, res);

        expect(mockGetOwnerListings).toHaveBeenCalledWith(
            expect.objectContaining({
                sellerId: '65f0a1b2c3d4e5f6a7b8c9d1',
                status: { $in: ['active', 'live', 'deactivated'] },
                isDeleted: { $ne: true },
            }),
            1,
            10
        );
    });

    it('queries for pending tab correctly', async () => {
        mockGetOwnerListings.mockResolvedValue({ items: [], total: 0 });

        const req = {
            user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1' },
            query: { tab: 'pending' },
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyTabListings(req, res);

        expect(mockGetOwnerListings).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'pending',
            }),
            1,
            20 // Default limit
        );
    });

    it('queries for expired tab correctly', async () => {
        mockGetOwnerListings.mockResolvedValue({ items: [], total: 0 });

        const req = {
            user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1' },
            query: { tab: 'expired' },
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyTabListings(req, res);

        expect(mockGetOwnerListings).toHaveBeenCalledWith(
            expect.objectContaining({
                status: { $in: ['expired', 'sold'] },
            }),
            1,
            20
        );
    });

    it('returns 500 if getOwnerListings fails', async () => {
        const error = new Error('Query error');
        mockGetOwnerListings.mockRejectedValue(error);

        const req = {
            user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1' },
            query: { tab: 'live' },
        } as unknown as Request;
        const res = {} as unknown as Response;

        await getMyTabListings(req, res);

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch tab listings', { error });
        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 500, 'Failed to retrieve listings');
    });
});
