jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: {
        aggregate: jest.fn(),
        countDocuments: jest.fn(),
    },
}));

import Ad from '../../models/Ad';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { getModerationCounts, MODERATION_STATUSES } from '../../services/ListingModerationQueryService';
import { HIDDEN_MODERATION_STATUSES } from '../../utils/FeedVisibilityGuard';

const mockedAdModel = Ad as unknown as {
    aggregate: jest.Mock;
    countDocuments: jest.Mock;
};

describe('getModerationCounts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses public visibility for live counts and spotlight active checks', async () => {
        mockedAdModel.aggregate
            .mockResolvedValueOnce([
                { _id: 'ad', count: 6 },
                { _id: 'service', count: 2 },
            ])
            .mockResolvedValueOnce([
                { _id: { listingType: 'ad', status: AD_STATUS.LIVE }, count: 10 },
                { _id: { listingType: 'ad', status: AD_STATUS.PENDING }, count: 3 },
                { _id: { listingType: 'service', status: AD_STATUS.LIVE }, count: 4 },
            ]);
        mockedAdModel.countDocuments.mockResolvedValueOnce(5);

        const counts = await getModerationCounts();

        expect(counts.total).toBe(17);
        expect(counts.pending).toBe(3);
        expect(counts.live).toBe(8);
        expect(counts.byStatus.live).toBe(8);
        expect(counts.byListingType.ad.live).toBe(6);
        expect(counts.byListingType.service.live).toBe(2);
        expect(counts.byListingType.spare_part.live).toBe(0);
        expect(counts.spotlight).toBe(5);

        expect(mockedAdModel.aggregate).toHaveBeenCalledTimes(2);
        expect(mockedAdModel.countDocuments).toHaveBeenCalledTimes(1);

        const livePipeline = mockedAdModel.aggregate.mock.calls[0][0];
        expect(livePipeline[0]).toEqual({
            $match: {
                status: AD_STATUS.LIVE,
                isDeleted: { $ne: true },
                expiresAt: { $gt: expect.any(Date) },
                moderationStatus: { $nin: [...HIDDEN_MODERATION_STATUSES] },
            },
        });

        const rawStatusPipeline = mockedAdModel.aggregate.mock.calls[1][0];
        expect(rawStatusPipeline[0]).toEqual({
            $match: {
                isDeleted: { $ne: true },
                status: { $in: [...MODERATION_STATUSES] },
            },
        });

        expect(mockedAdModel.countDocuments).toHaveBeenCalledWith({
            status: AD_STATUS.LIVE,
            isDeleted: { $ne: true },
            expiresAt: { $gt: expect.any(Date) },
            moderationStatus: { $nin: [...HIDDEN_MODERATION_STATUSES] },
            isSpotlight: true,
            spotlightExpiresAt: { $gt: expect.any(Date) },
        });
    });

    it('applies listingType to live and spotlight filters when provided', async () => {
        mockedAdModel.aggregate
            .mockResolvedValueOnce([
                { _id: 'service', count: 3 }
            ])
            .mockResolvedValueOnce([
                { _id: { listingType: 'service', status: AD_STATUS.PENDING }, count: 4 },
                { _id: { listingType: 'service', status: AD_STATUS.LIVE }, count: 6 },
            ]);
        mockedAdModel.countDocuments.mockResolvedValueOnce(2);

        const counts = await getModerationCounts('service');

        expect(counts.live).toBe(3);
        expect(counts.byListingType.service.live).toBe(3);
        expect(mockedAdModel.aggregate).toHaveBeenCalledTimes(2);
        expect(mockedAdModel.countDocuments).toHaveBeenCalledTimes(1);

        const livePipeline = mockedAdModel.aggregate.mock.calls[0][0];
        expect(livePipeline[0]).toEqual({
            $match: {
                status: AD_STATUS.LIVE,
                isDeleted: { $ne: true },
                expiresAt: { $gt: expect.any(Date) },
                moderationStatus: { $nin: [...HIDDEN_MODERATION_STATUSES] },
                listingType: 'service',
            },
        });

        expect(mockedAdModel.countDocuments).toHaveBeenCalledWith({
            status: AD_STATUS.LIVE,
            isDeleted: { $ne: true },
            expiresAt: { $gt: expect.any(Date) },
            moderationStatus: { $nin: [...HIDDEN_MODERATION_STATUSES] },
            listingType: 'service',
            isSpotlight: true,
            spotlightExpiresAt: { $gt: expect.any(Date) },
        });
    });
});
