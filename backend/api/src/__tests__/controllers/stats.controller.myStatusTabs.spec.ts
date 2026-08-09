const mockGetOwnerListings = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();
const mockRunSweep = jest.fn().mockResolvedValue(undefined);
const mockGetListingStatusCounts = jest.fn();
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

jest.mock('@esparex/core/services/ad/AdMetricsService', () => ({
    getSellerListingStats: jest.fn().mockResolvedValue({}),
    getListingStatusCountsForSeller: (...args: unknown[]) => mockGetListingStatusCounts(...args),
}));

jest.mock('@esparex/core/services/lifecycle/ListingExpiryService', () => ({
    ListingExpiryService: {
        runSweep: (...args: unknown[]) => mockRunSweep(...args),
    },
}));

jest.mock('../../utils/respond', () => ({
    sendSuccessResponse: mockSendSuccessResponse,
}));

jest.mock('../../utils/errorResponse', () => ({
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
        const mockCounts = { live: 3, pending: 3, expired: 1, total: 7 };
        mockGetListingStatusCounts.mockResolvedValue(mockCounts);

        const req = {
            user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1' },
            query: {},
        } as any;
        const res = {} as any;

        await getMyListingStatusCounts(req, res);

        expect(mockGetListingStatusCounts).toHaveBeenCalledWith('65f0a1b2c3d4e5f6a7b8c9d1', undefined);
        expect(mockSendSuccessResponse).toHaveBeenCalledWith(res, mockCounts);
    });

    it('returns 401 if user is not authenticated', async () => {
        const req = {
            user: undefined,
        } as any;
        const res = {} as any;

        await getMyListingStatusCounts(req, res);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 401, 'Unauthorized');
    });

    it('returns 500 if service fails', async () => {
        const error = new Error('Aggregation failed');
        mockGetListingStatusCounts.mockRejectedValue(error);

        const req = {
            user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1' },
            query: {},
        } as any;
        const res = {} as any;

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
        } as any;
        const res = {} as any;

        await getMyTabListings(req, res);

        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 401, 'Unauthorized');
    });

    it('queries for live tab correctly with status: active and live', async () => {
        mockGetOwnerListings.mockResolvedValue({ items: [], total: 0 });

        const req = {
            user: { _id: '65f0a1b2c3d4e5f6a7b8c9d1' },
            query: { tab: 'live', page: '1', limit: '10' },
        } as any;
        const res = {} as any;

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
        } as any;
        const res = {} as any;

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
        } as any;
        const res = {} as any;

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
        } as any;
        const res = {} as any;

        await getMyTabListings(req, res);

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch tab listings', { error });
        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 500, 'Failed to retrieve listings');
    });
});
