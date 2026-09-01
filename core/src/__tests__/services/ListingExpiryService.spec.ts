import { ListingExpiryService } from '../../services/lifecycle/ListingExpiryService';
import { LISTING_STATUS, ACTOR_TYPE } from '@esparex/contracts';
import { mutateStatusesBulk } from '../../services/lifecycle/StatusMutationService';
import { lifecycleEvents } from '../../events';

jest.mock('../../composition/listings', () => {
    const mockRepo = {
        find: jest.fn(),
        updateMany: jest.fn(),
    };
    const mockCache = {
        invalidateAdFeedCaches: jest.fn(),
    };
    return {
        getListingRepository: () => mockRepo,
        getListingsCache: () => mockCache,
    };
});

jest.mock('../../services/lifecycle/StatusMutationService', () => ({
    mutateStatusesBulk: jest.fn(),
}));

jest.mock('../../events', () => ({
    lifecycleEvents: {
        dispatch: jest.fn(),
    },
}));

describe('ListingExpiryService', () => {
    let mockRepo: any;
    let mockCache: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        const { getListingRepository, getListingsCache } = await import('../../composition/listings');
        mockRepo = getListingRepository();
        mockCache = getListingsCache();
    });

    it('returns zero counts when no listings are expired', async () => {
        mockRepo.find.mockResolvedValue([]);

        const result = await ListingExpiryService.runSweep(new Date());

        expect(result).toEqual({
            expiredCount: 0,
            touchedCount: 0,
            listingIds: [],
        });
        expect(mockRepo.updateMany).not.toHaveBeenCalled();
        expect(mutateStatusesBulk).not.toHaveBeenCalled();
        expect(lifecycleEvents.dispatch).not.toHaveBeenCalled();
        expect(mockCache.invalidateAdFeedCaches).not.toHaveBeenCalled();
    });

    it('successfully transitions expired listings, clears spotlight, locks chat, dispatches events, and invalidates caches', async () => {
        const now = new Date('2026-08-31T12:00:00Z');
        const mockExpiring = [
            { id: 'ad-1', title: 'Ad 1', expiresAt: new Date('2026-08-30T12:00:00Z') },
            { id: 'ad-2', title: 'Ad 2', expiresAt: new Date('2026-08-25T12:00:00Z') },
        ];

        mockRepo.find.mockResolvedValue(mockExpiring);
        mockRepo.updateMany.mockResolvedValue({ modifiedCount: 2 });
        (mutateStatusesBulk as jest.Mock).mockResolvedValue(2);

        const result = await ListingExpiryService.runSweep(now);

        expect(mockRepo.find).toHaveBeenCalledWith({
            status: LISTING_STATUS.LIVE,
            expiresAt: { $lte: now },
            isDeleted: false,
        });

        expect(mockRepo.updateMany).toHaveBeenCalledWith(
            { ids: ['ad-1', 'ad-2'] },
            { isSpotlight: false, isChatLocked: true }
        );

        expect(mutateStatusesBulk).toHaveBeenCalledWith(
            'ad',
            ['ad-1', 'ad-2'],
            LISTING_STATUS.EXPIRED,
            { type: ACTOR_TYPE.SYSTEM, id: 'listing_expiry_cron' },
            'Automated expiry'
        );

        expect(lifecycleEvents.dispatch).toHaveBeenCalledWith('listing.expired.bulk', {
            count: 2,
            listingIds: ['ad-1', 'ad-2'],
            source: 'ListingExpiryService',
        });

        expect(mockCache.invalidateAdFeedCaches).toHaveBeenCalled();

        expect(result).toEqual({
            expiredCount: 2,
            touchedCount: 2,
            listingIds: ['ad-1', 'ad-2'],
        });
    });
});
