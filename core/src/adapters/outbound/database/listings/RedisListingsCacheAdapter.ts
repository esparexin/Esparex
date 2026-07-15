import { ListingsCachePort } from '../../../../domains/listings';
import { invalidateAdFeedCaches, invalidatePublicAdCache } from '../../../../utils/redisCache';
import logger from '../../../../utils/logger';

export class RedisListingsCacheAdapter implements ListingsCachePort {
    async invalidateAdFeedCaches(): Promise<void> {
        try {
            await invalidateAdFeedCaches();
            logger.info('Listings feed cache invalidated via adapter');
        } catch (error) {
            logger.error('Failed to invalidate listings feed cache via adapter', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    async invalidatePublicAdCache(adId: string): Promise<void> {
        try {
            await invalidatePublicAdCache(adId);
            logger.info('Public listing cache invalidated via adapter', { adId });
        } catch (error) {
            logger.error('Failed to invalidate public listing cache via adapter', {
                adId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
}
