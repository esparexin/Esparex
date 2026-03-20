import Ad from '../models/Ad';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { ACTOR_TYPE } from '../../../shared/enums/actor';
import { mutateStatusesBulk } from './StatusMutationService';
import { lifecycleEvents } from '../events';
import logger from '../utils/logger';

export type ListingExpirySweepResult = {
    expiredCount: number;
    touchedCount: number;
    listingIds: string[];
};

export class ListingExpiryService {
    static async runSweep(now: Date = new Date()): Promise<ListingExpirySweepResult> {
        const expiringListings = await Ad.find({
            status: AD_STATUS.LIVE,
            expiresAt: { $lte: now },
            isDeleted: { $ne: true },
        })
            .select('_id')
            .lean<Array<{ _id: unknown }>>();

        if (expiringListings.length === 0) {
            return {
                expiredCount: 0,
                touchedCount: 0,
                listingIds: [],
            };
        }

        const listingIds = expiringListings
            .map((doc) => String(doc._id))
            .filter((id) => id.length > 0);

        await Ad.updateMany(
            { _id: { $in: listingIds } },
            {
                $set: {
                    isSpotlight: false,
                    isChatLocked: true,
                },
            }
        );

        const expiredCount = await mutateStatusesBulk(
            'ad',
            listingIds,
            AD_STATUS.EXPIRED,
            { type: ACTOR_TYPE.SYSTEM, id: 'listing_expiry_cron' },
            'Automated expiry'
        );

        await lifecycleEvents.dispatch('listing.expired.bulk', {
            count: expiredCount,
            listingIds,
            source: 'ListingExpiryService',
        });

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
