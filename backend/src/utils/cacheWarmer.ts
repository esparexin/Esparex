import Category from '../models/Category';
import { setCache, CACHE_KEYS, CACHE_TTLS } from './redisCache';
import logger from './logger';

/**
 * Proactively cache the full category tree.
 * This is the most frequent DB query and significantly improves home page load.
 */
export async function warmCategoryCache() {
    try {
        // Use standard query to match the frontend selection pattern
        const categories = await (Category as typeof Category).find({
            isDeleted: { $ne: true }, 
            isActive: true 
        })
        .select('name slug parentId type icon description listingType serviceSelectionMode hasScreenSizes')
        .lean();
        
        if (categories && categories.length > 0) {
            await setCache(CACHE_KEYS.CATEGORIES, categories, CACHE_TTLS.CATEGORIES);
            logger.info(`[CACHE_WARMER] Successfully warmed Category cache with ${categories.length} entries.`);
        }
    } catch (error) {
        logger.error('[CACHE_WARMER] Failed to warm Category cache', error);
    }
}

/**
 * Execute all cache warming tasks.
 * Should be called after DB is connected but before server starts listening.
 */
export async function warmAllCaches() {
    logger.info('[CACHE_WARMER] Starting background cache warm-up...');
    try {
        await Promise.all([
            warmCategoryCache()
        ]);
        logger.info('[CACHE_WARMER] All cache warming tasks completed.');
    } catch (error) {
        logger.warn('[CACHE_WARMER] Cache warm-up hit an issue, but startup will proceed.', error);
    }
}
