import logger from '../../utils/logger';
import { lifecycleEvents } from '../LifecycleEventDispatcher';
import { invalidateAdFeedCaches, invalidatePublicAdCache } from '../../utils/redisCache';
import axios from 'axios';
import { getFrontendInternalUrl } from '../../utils/appUrl';

const triggerNextJsRevalidation = async () => {
    try {
        const baseUrl = getFrontendInternalUrl();
        await axios.post(`${baseUrl}/internal/revalidate`, { tag: 'homeFeed' }, { timeout: 3000 });
        logger.info('[CacheInvalidationListener] Next.js homeFeed cache revalidated successfully.');
    } catch (error) {
        logger.error('[CacheInvalidationListener] Failed to trigger Next.js revalidation webhook', { error: error instanceof Error ? error.message : String(error) });
    }
};

export const registerCacheInvalidationListener = () => {
    
    // 1. Single Ad Lifecycle Mutations
    lifecycleEvents.on('ad.lifecycle.changed', async (payload: any) => {
        logger.info(`[CacheInvalidationListener] Processing ad.lifecycle.changed for ad ${payload.adId}`);
        try {
            // Bust the global homepage/feed caching aggregations
            await invalidateAdFeedCaches();
            // Bust the specific ad detail route caching
            await invalidatePublicAdCache(payload.adId);
            // Bust Next.js frontend cache
            await triggerNextJsRevalidation();
        } catch (error) {
            logger.error(`[CacheInvalidationListener] Failed to invalidate cache for ad ${payload.adId}`, { error });
        }
    }, 'CacheInvalidation_AdLifecycleChanged');

    // 2. Bulk Ad Expiry (Cron)
    lifecycleEvents.on('ad.expired.bulk', async (payload) => {
        if (payload.count <= 0) return;
        logger.info(`[CacheInvalidationListener] Processing ad.expired.bulk (${payload.count} ads expired)`);
        
        try {
            // Bust feeds. Note: we do NOT loop and invalidate individual detail caches natively here
            // to avoid stampedes. The detail cache naturally expires, or we handle it progressively.
            await invalidateAdFeedCaches();
            await triggerNextJsRevalidation();
        } catch (error) {
            logger.error(`[CacheInvalidationListener] Failed to invalidate bulk feed caches`, { error });
        }
    }, 'CacheInvalidation_AdExpiredBulk');

    // 3. Bulk Spotlight Expiry (Cron)
    lifecycleEvents.on('ad.spotlight.expired', async (payload) => {
        if (payload.count <= 0) return;
        logger.info(`[CacheInvalidationListener] Processing ad.spotlight.expired (${payload.count} boosts expired)`);
        
        try {
            // Recalculates spotlight presence in feeds
            await invalidateAdFeedCaches();
            await triggerNextJsRevalidation();
        } catch (error) {
            logger.error(`[CacheInvalidationListener] Failed to invalidate spotlight caches`, { error });
        }
    }, 'CacheInvalidation_AdSpotlightExpired');

    logger.info('[CacheInvalidationListener] Registered successfully.');
};
