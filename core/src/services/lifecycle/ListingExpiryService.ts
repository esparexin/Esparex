import { getListingRepository } from '../../composition/listings';
import { LISTING_STATUS } from '@esparex/shared';
import { ACTOR_TYPE } from '@esparex/shared';
import { mutateStatusesBulk } from './StatusMutationService';
import { lifecycleEvents } from '../../events';
import logger from '../../utils/logger';

export type ListingExpirySweepResult = {
    expiredCount: number;
    touchedCount: number;
    listingIds: string[];
};

export class ListingExpiryService {
    static async runSweep(now: Date = new Date()): Promise<ListingExpirySweepResult> {
        const expiringListings = await getListingRepository().find({
            status: LISTING_STATUS.LIVE,
            expiresAt: { $lte: now } as any,
            isDeleted: false as any,
        });

        if (expiringListings.length === 0) {
            return {
                expiredCount: 0,
                touchedCount: 0,
                listingIds: [],
            };
        }

        const listingIds = expiringListings
            .map((doc) => doc.id)
            .filter((id) => id.length > 0);

        await getListingRepository().updateMany(
            { ids: listingIds },
            {
                isSpotlight: false,
                isChatLocked: true,
            }
        );

        const expiredCount = await mutateStatusesBulk(
            'ad',
            listingIds,
            LISTING_STATUS.EXPIRED,
            { type: ACTOR_TYPE.SYSTEM, id: 'listing_expiry_cron' },
            'Automated expiry'
        );

        await lifecycleEvents.dispatch('listing.expired.bulk', {
            count: expiredCount,
            listingIds,
            source: 'ListingExpiryService',
        });

        const { invalidateAdFeedCaches } = await import('../../utils/redisCache');
        await invalidateAdFeedCaches();

        logger.info('[ListingExpiryService] Expiry sweep completed', {
            expiredCount,
            touchedCount: listingIds.length,
        });

        return {
            expiredCount,
            touchedCount: listingIds.length,
            listingIds,
        };
    }
}
