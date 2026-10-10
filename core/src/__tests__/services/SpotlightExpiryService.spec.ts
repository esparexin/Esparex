import { SpotlightExpiryService } from '../../domains/listings/application/lifecycle/SpotlightExpiryService';
import { ListingExpiryService } from '../../domains/listings/application/lifecycle/ListingExpiryService';

const mockRepo = {
    find: jest.fn(),
    updateMany: jest.fn(),
};

const mockCache = {
    invalidateAdFeedCaches: jest.fn(),
};

jest.mock('../../composition/listings', () => ({
    getListingRepository: () => mockRepo,
    getListingsCache: () => mockCache,
}));

describe('SpotlightExpiryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 0 when no spotlights are expired', async () => {
        mockRepo.find.mockResolvedValue([]);

        const count = await SpotlightExpiryService.sweep(new Date());

        expect(count).toBe(0);
        expect(mockRepo.updateMany).not.toHaveBeenCalled();
        expect(mockCache.invalidateAdFeedCaches).not.toHaveBeenCalled();
    });

    it('clears isSpotlight to false and invalidates feed cache when expired spotlights exist', async () => {
        const now = new Date('2026-10-09T12:00:00Z');
        const mockExpiredSpotlights = [
            { id: 'spot-1', isSpotlight: true, spotlightExpiresAt: new Date('2026-10-09T10:00:00Z') },
            { id: 'spot-2', isSpotlight: true, spotlightExpiresAt: new Date('2026-10-09T11:00:00Z') },
        ];

        mockRepo.find.mockResolvedValue(mockExpiredSpotlights);
        mockRepo.updateMany.mockResolvedValue(2);

        const count = await SpotlightExpiryService.sweep(now);

        expect(count).toBe(2);
        expect(mockRepo.find).toHaveBeenCalledWith({
            isSpotlight: true,
            spotlightExpiresAt: { $lte: now },
            isDeleted: false,
        });
        expect(mockRepo.updateMany).toHaveBeenCalledWith(
            { ids: ['spot-1', 'spot-2'] },
            { isSpotlight: false }
        );
        expect(mockCache.invalidateAdFeedCaches).toHaveBeenCalled();
    });

    it('delegates properly via ListingExpiryService.sweepExpiredSpotlights', async () => {
        mockRepo.find.mockResolvedValue([]);

        const count = await ListingExpiryService.sweepExpiredSpotlights(new Date());

        expect(count).toBe(0);
    });
});
