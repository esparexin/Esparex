import mongoose from 'mongoose';

jest.mock('@esparex/core/models/Ad', () => ({
    __esModule: true,
    default: {
        countDocuments: jest.fn(),
        aggregate: jest.fn(),
    },
}));

jest.mock('@esparex/core/models/Category', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock('@esparex/core/models/Report', () => ({
    __esModule: true,
    default: {
        aggregate: jest.fn(),
    },
}));

jest.mock('@esparex/core/utils/redisCache', () => ({
    getCache: jest.fn(),
    setCache: jest.fn(),
    CACHE_TTLS: {
        HOME_PAGE: 60,
    },
}));

jest.mock('@esparex/core/utils/s3', () => ({
    sanitizePersistedImageUrls: (urls: string[]) => urls,
}));

import Ad from '../../models/Ad';
import { buildAdSortStage } from '../../domains/listings/application/ad/ad/AdSearchService';
import { getAdCounts } from '../../domains/listings/application/ad/ad/AdMetricsService';
import { buildPublicAdFilter } from '../../utils/FeedVisibilityGuard';

const mockedAdModel = Ad as any;

describe('getAdCounts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('ignores invalid sellerId values instead of applying a bad ObjectId filter', async () => {
        mockedAdModel.countDocuments
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);

        const result = await getAdCounts({ sellerId: 'not-object-id' });

        expect(result).toEqual({
            live: 0,
            pending: 0,
            sold: 0,
            rejected: 0,
            expired: 0,
            deactivated: 0,
            total: 0,
        });
        expect(mockedAdModel.countDocuments).toHaveBeenCalledTimes(7);
        mockedAdModel.countDocuments.mock.calls.forEach(([filter]: any) => {
            expect((filter as Record<string, unknown>).sellerId).toBeUndefined();
        });
    });

    it('uses explicit per-status filters with soft-delete exclusion', async () => {
        mockedAdModel.countDocuments
            .mockResolvedValueOnce(11) // live
            .mockResolvedValueOnce(7)  // pending
            .mockResolvedValueOnce(5)  // sold
            .mockResolvedValueOnce(3)  // rejected
            .mockResolvedValueOnce(2)  // expired
            .mockResolvedValueOnce(1)  // deactivated
            .mockResolvedValueOnce(29); // total

        const sellerId = new mongoose.Types.ObjectId().toString();
        const result = await getAdCounts({ sellerId });

        expect(result).toEqual({
            live: 11,
            pending: 7,
            sold: 5,
            rejected: 3,
            expired: 2,
            deactivated: 1,
            total: 29,
        });

        expect(mockedAdModel.countDocuments).toHaveBeenCalledTimes(7);

        const calls = mockedAdModel.countDocuments.mock.calls.map(([filter]: any) => filter as Record<string, unknown>);
        const statuses = calls.slice(0, 6).map((call: any) => call.status);
        expect(statuses).toEqual(['live', 'pending', 'sold', 'rejected', 'expired', 'deactivated']);
        expect(calls[6]?.status).toBeUndefined();

        calls.forEach((call: any) => {
            expect(call).toMatchObject({
                isDeleted: { $ne: true },
            });
            expect(call.sellerId).toBeInstanceOf(mongoose.Types.ObjectId);
            expect((call.sellerId as mongoose.Types.ObjectId).toString()).toBe(sellerId);
        });
    });
});

describe('buildAdSortStage', () => {
    it('sorts by geo distance when sortBy=distance', () => {
        const sort = buildAdSortStage({ sortBy: 'distance' });
        expect(sort).toEqual({ distance: 1, createdAt: -1 });
    });

    it('sorts by newest (createdAt -1) when sortBy=newest', () => {
        expect(buildAdSortStage({ sortBy: 'newest' })).toEqual({ createdAt: -1 });
    });

    it('sorts by oldest (createdAt 1) when sortBy=oldest', () => {
        expect(buildAdSortStage({ sortBy: 'oldest' })).toEqual({ createdAt: 1 });
    });

    it('sorts by price high (price -1) for both price_high and price-high', () => {
        expect(buildAdSortStage({ sortBy: 'price_high' })).toEqual({ price: -1 });
        expect(buildAdSortStage({ sortBy: 'price-high' })).toEqual({ price: -1 });
    });

    it('sorts by price low (price 1) for both price_low and price-low', () => {
        expect(buildAdSortStage({ sortBy: 'price_low' })).toEqual({ price: 1 });
        expect(buildAdSortStage({ sortBy: 'price-low' })).toEqual({ price: 1 });
    });

    it('sorts by risk desc when sortBy=risk_desc', () => {
        expect(buildAdSortStage({ sortBy: 'risk_desc' })).toEqual({ fraudScore: -1, createdAt: -1 });
    });

    it('sorts by most viewed when sortBy=most_viewed', () => {
        expect(buildAdSortStage({ sortBy: 'most_viewed' })).toEqual({ viewsCount: -1, createdAt: -1 });
    });
});
