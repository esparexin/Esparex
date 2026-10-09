import { getListingRepository } from '../../../../composition/listings';
import logger from '../../../../utils/logger';

export class SpotlightExpiryService {
    /**
     * Sweeps listings whose spotlight duration has passed and clears isSpotlight: false.
     * Prevents expired spotlights from lingering in the database or appearing on listing cards.
     */
    static async sweep(now: Date = new Date()): Promise<number> {
        const expiredSpotlights = await getListingRepository().find({
            isSpotlight: true,
            spotlightExpiresAt: { $lte: now },
            isDeleted: false,
        });

        if (expiredSpotlights.length === 0) {
            return 0;
        }

        const spotlightIds = expiredSpotlights
            .map((doc) => doc.id)
            .filter((id) => id.length > 0);

        const updatedCount = await getListingRepository().updateMany(
            { ids: spotlightIds },
            { isSpotlight: false }
        );

        const { getListingsCache } = await import('../../../../composition/listings');
        await getListingsCache().invalidateAdFeedCaches();

        logger.info('[SpotlightExpiryService] Spotlight expiry sweep completed', {
            expiredSpotlightCount: updatedCount,
            listingIds: spotlightIds,
        });

        return updatedCount;
    }
}
