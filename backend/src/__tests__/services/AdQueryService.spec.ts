import mongoose from 'mongoose';

jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: {
        countDocuments: jest.fn(),
        aggregate: jest.fn(),
    },
}));

jest.mock('../../models/Category', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../models/Report', () => ({
    __esModule: true,
    default: {
        aggregate: jest.fn(),
    },
}));

jest.mock('../../utils/redisCache', () => ({
    getCache: jest.fn(),
    setCache: jest.fn(),
    CACHE_TTLS: {
        HOME_PAGE: 60,
    },
}));

jest.mock('../../utils/s3', () => ({
    sanitizePersistedImageUrls: (urls: string[]) => urls,
}));

import Ad from '../../models/Ad';
import { buildAdSortStage, getAdCounts } from '../../services/AdQueryService';

const mockedAdModel = Ad as unknown as {
    countDocuments: jest.Mock;
};

describe('getAdCounts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns zero counts and skips DB calls for invalid sellerId', async () => {
        const result = await getAdCounts({ sellerId: 'not-object-id' });

        expect(result).toEqual({
            active: 0,
            pending: 0,
            sold: 0,
            rejected: 0,
            expired: 0,
            deactivated: 0,
        });
        expect(mockedAdModel.countDocuments).not.toHaveBeenCalled();
    });

    it('uses explicit per-status filters with soft-delete exclusion', async () => {
        mockedAdModel.countDocuments
            .mockResolvedValueOnce(11) // active
            .mockResolvedValueOnce(7)  // pending
            .mockResolvedValueOnce(5)  // sold
            .mockResolvedValueOnce(3)  // rejected
            .mockResolvedValueOnce(2)  // expired
            .mockResolvedValueOnce(1); // deactivated

        const sellerId = new mongoose.Types.ObjectId().toString();
        const result = await getAdCounts({ sellerId });

        expect(result).toEqual({
            active: 11,
            pending: 7,
            sold: 5,
            rejected: 3,
            expired: 2,
            deactivated: 1,
        });

        expect(mockedAdModel.countDocuments).toHaveBeenCalledTimes(6);

        const calls = mockedAdModel.countDocuments.mock.calls.map(([filter]) => filter as Record<string, unknown>);
        const statuses = calls.map((call) => call.status);
        expect(statuses).toEqual(['active', 'pending', 'sold', 'rejected', 'expired', 'deactivated']);

        calls.forEach((call) => {
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
});
