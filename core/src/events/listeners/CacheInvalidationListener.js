"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCacheInvalidationListener = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const LifecycleEventDispatcher_1 = require("../LifecycleEventDispatcher");
const redisCache_1 = require("@core/utils/redisCache");
const axios_1 = __importDefault(require("axios"));
const appUrl_1 = require("@core/utils/appUrl");
const triggerNextJsRevalidation = async () => {
    try {
        const baseUrl = (0, appUrl_1.getFrontendInternalUrl)();
        await axios_1.default.post(`${baseUrl}/internal/revalidate`, { tag: 'homeFeed' }, { timeout: 3000 });
        logger_1.default.info('[CacheInvalidationListener] Next.js homeFeed cache revalidated successfully.');
    }
    catch (error) {
        logger_1.default.error('[CacheInvalidationListener] Failed to trigger Next.js revalidation webhook', { error: error instanceof Error ? error.message : String(error) });
    }
};
const registerCacheInvalidationListener = () => {
    // 1. Single Ad Lifecycle Mutations
    LifecycleEventDispatcher_1.lifecycleEvents.on('ad.lifecycle.changed', async (payload) => {
        logger_1.default.info(`[CacheInvalidationListener] Processing ad.lifecycle.changed for ad ${payload.adId}`);
        try {
            // Bust the global homepage/feed caching aggregations
            await (0, redisCache_1.invalidateAdFeedCaches)();
            // Bust the specific ad detail route caching
            await (0, redisCache_1.invalidatePublicAdCache)(payload.adId);
            // Bust Next.js frontend cache
            await triggerNextJsRevalidation();
        }
        catch (error) {
            logger_1.default.error(`[CacheInvalidationListener] Failed to invalidate cache for ad ${payload.adId}`, { error });
        }
    }, 'CacheInvalidation_AdLifecycleChanged');
    // 2. Bulk Ad Expiry (Cron)
    LifecycleEventDispatcher_1.lifecycleEvents.on('ad.expired.bulk', async (payload) => {
        if (payload.count <= 0)
            return;
        logger_1.default.info(`[CacheInvalidationListener] Processing ad.expired.bulk (${payload.count} ads expired)`);
        try {
            // Bust feeds. Note: we do NOT loop and invalidate individual detail caches natively here
            // to avoid stampedes. The detail cache naturally expires, or we handle it progressively.
            await (0, redisCache_1.invalidateAdFeedCaches)();
            await triggerNextJsRevalidation();
        }
        catch (error) {
            logger_1.default.error(`[CacheInvalidationListener] Failed to invalidate bulk feed caches`, { error });
        }
    }, 'CacheInvalidation_AdExpiredBulk');
    // 3. Bulk Spotlight Expiry (Cron)
    LifecycleEventDispatcher_1.lifecycleEvents.on('ad.spotlight.expired', async (payload) => {
        if (payload.count <= 0)
            return;
        logger_1.default.info(`[CacheInvalidationListener] Processing ad.spotlight.expired (${payload.count} boosts expired)`);
        try {
            // Recalculates spotlight presence in feeds
            await (0, redisCache_1.invalidateAdFeedCaches)();
            await triggerNextJsRevalidation();
        }
        catch (error) {
            logger_1.default.error(`[CacheInvalidationListener] Failed to invalidate spotlight caches`, { error });
        }
    }, 'CacheInvalidation_AdSpotlightExpired');
    logger_1.default.info('[CacheInvalidationListener] Registered successfully.');
};
exports.registerCacheInvalidationListener = registerCacheInvalidationListener;
//# sourceMappingURL=CacheInvalidationListener.js.map