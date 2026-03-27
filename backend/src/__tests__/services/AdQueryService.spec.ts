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
import { buildAdSortStage, buildHomeFeedPipeline, getAdCounts } from '../../services/AdQueryService';
import { buildPublicAdFilter } from '../../utils/FeedVisibilityGuard';

const mockedAdModel = Ad as unknown as {
    countDocuments: jest.Mock;
};

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
        mockedAdModel.countDocuments.mock.calls.forEach(([filter]) => {
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

        const calls = mockedAdModel.countDocuments.mock.calls.map(([filter]) => filter as Record<string, unknown>);
        const statuses = calls.slice(0, 6).map((call) => call.status);
        expect(statuses).toEqual(['live', 'pending', 'sold', 'rejected', 'expired', 'deactivated']);
        expect(calls[6]?.status).toBeUndefined();

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

describe('buildHomeFeedPipeline', () => {
    it('uses a compound cursor and routes stale spotlight rows into non-spotlight buckets', () => {
        const boostedId = new mongoose.Types.ObjectId();
        const cursorId = new mongoose.Types.ObjectId();
        const cursorDate = new Date('2026-03-21T12:00:00.000Z');

        const pipeline = buildHomeFeedPipeline(
            { categoryId: 'phones' },
            [boostedId],
            12,
            undefined,
            {
                createdAt: cursorDate,
                id: cursorId.toHexString()
            }
        );

        expect(pipeline[1]).toEqual({
            $match: {
                $or: [
                    { createdAt: { $lt: cursorDate } },
                    { createdAt: cursorDate, _id: { $lt: cursorId } }
                ]
            }
        });
        expect(pipeline[2]).toEqual({ $sort: { createdAt: -1, _id: -1 } });

        const facetStage = pipeline[3] as unknown as {
            $facet: {
                spotlight: Array<Record<string, unknown>>;
                boosted: Array<Record<string, unknown>>;
                organic: Array<Record<string, unknown>>;
            };
        };

        const visibilityMatch = {
            categoryId: 'phones',
            ...buildPublicAdFilter(),
            expiresAt: { $gt: expect.any(Date) },
        };

        expect(facetStage.$facet.spotlight[0]).toEqual({
            $match: {
                ...visibilityMatch,
                isSpotlight: true,
                spotlightExpiresAt: { $gt: expect.any(Date) }
            }
        });
        expect(facetStage.$facet.boosted[0]).toEqual({
            $match: {
                _id: { $in: [boostedId] },
                ...visibilityMatch,
                $or: [
                    { isSpotlight: { $ne: true } },
                    { spotlightExpiresAt: { $exists: false } },
                    { spotlightExpiresAt: null },
                    { spotlightExpiresAt: { $lte: expect.any(Date) } }
                ]
            }
        });
        expect(facetStage.$facet.organic[0]).toEqual({
            $match: {
                _id: { $nin: [boostedId] },
                ...visibilityMatch,
                $or: [
                    { isSpotlight: { $ne: true } },
                    { spotlightExpiresAt: { $exists: false } },
                    { spotlightExpiresAt: null },
                    { spotlightExpiresAt: { $lte: expect.any(Date) } }
                ]
            }
        });
    });

    it('falls back to legacy date-only cursor matching when no cursor id is available', () => {
        const cursorDate = new Date('2026-03-21T12:00:00.000Z');

        const pipeline = buildHomeFeedPipeline(
            {},
            [],
            8,
            undefined,
            {
                createdAt: cursorDate,
                id: null
            }
        );

        expect(pipeline[1]).toEqual({
            $match: {
                createdAt: { $lt: cursorDate }
            }
        });
        expect(pipeline[2]).toEqual({ $sort: { createdAt: -1, _id: -1 } });
    });
});
