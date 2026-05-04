"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmCategoryCache = warmCategoryCache;
exports.warmAllCaches = warmAllCaches;
const Category_1 = __importDefault(require("@core/models/Category"));
const redisCache_1 = require("./redisCache");
const logger_1 = __importDefault(require("./logger"));
/**
 * Proactively cache the full category tree.
 * This is the most frequent DB query and significantly improves home page load.
 */
async function warmCategoryCache() {
    try {
        // Use standard query to match the frontend selection pattern
        const categories = await (Category_1.default).find({
            isDeleted: { $ne: true },
            isActive: true
        })
            .select('name slug parentId type icon description listingType serviceSelectionMode hasScreenSizes')
            .lean();
        if (categories && categories.length > 0) {
            await (0, redisCache_1.setCache)(redisCache_1.CACHE_KEYS.CATEGORIES, categories, redisCache_1.CACHE_TTLS.CATEGORIES);
            logger_1.default.info(`[CACHE_WARMER] Successfully warmed Category cache with ${categories.length} entries.`);
        }
    }
    catch (error) {
        logger_1.default.error('[CACHE_WARMER] Failed to warm Category cache', error);
    }
}
/**
 * Execute all cache warming tasks.
 * Should be called after DB is connected but before server starts listening.
 */
async function warmAllCaches() {
    logger_1.default.info('[CACHE_WARMER] Starting background cache warm-up...');
    try {
        await Promise.all([
            warmCategoryCache()
        ]);
        logger_1.default.info('[CACHE_WARMER] All cache warming tasks completed.');
    }
    catch (error) {
        logger_1.default.warn('[CACHE_WARMER] Cache warm-up hit an issue, but startup will proceed.', error);
    }
}
//# sourceMappingURL=cacheWarmer.js.map