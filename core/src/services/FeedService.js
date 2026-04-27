"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmHomeFeedCache = exports.getHomeFeedAds = void 0;
const crypto_1 = require("crypto");
const env_1 = require("@core/config/env");
const logger_1 = __importDefault(require("@core/utils/logger"));
const redisCache_1 = require("@core/utils/redisCache");
// Leaf Services
const FeedCursorService_1 = require("./feed/FeedCursorService");
const FeedCacheService_1 = require("./feed/FeedCacheService");
const FeedQueryService_1 = require("./feed/FeedQueryService");
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 48;
const HOME_FEED_CACHE_TTL_SECONDS = 300;
const FEED_BUILD_LOCK_WAIT_MS = 1200;
const FEED_BUILD_LOCK_POLL_MS = 120;
const normalizePositiveInt = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0)
        return fallback;
    return Math.floor(parsed);
};
const sleep = async (ms) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
};
/**
 * Main entry point for retrieving the home feed.
 * Features: Multi-level caching, Global build-lock (thundering herd protection),
 * Ranked merging, and fallback expansion logic.
 */
const getHomeFeedAds = async (input = {}) => {
    const limit = Math.min(MAX_LIMIT, Math.max(1, normalizePositiveInt(input.limit, DEFAULT_LIMIT)));
    const parsedCursor = (0, FeedCursorService_1.parseCursor)(input.cursor);
    const cacheKey = (0, FeedCacheService_1.buildHomeFeedCacheKey)(input, parsedCursor, limit);
    const startedAt = Date.now();
    // 1. Layer 1: Cache Lookup
    const cached = await (0, FeedCacheService_1.getCachedFeed)(cacheKey);
    if (cached) {
        if (env_1.env.FEED_DEBUG)
            logger_1.default.debug(`[Feed:Cache] HIT: ${cacheKey}`);
        return cached;
    }
    if (env_1.env.FEED_DEBUG)
        logger_1.default.debug(`[Feed:Cache] MISS: ${cacheKey}`);
    // 2. Layer 2: Thundering Herd Protection (Mutex)
    const lockToken = (0, crypto_1.randomUUID)();
    const hasBuildLock = await (0, FeedCacheService_1.tryAcquireFeedBuildLock)(lockToken);
    if (!hasBuildLock) {
        // Wait for the lock-holder to finish and populate the cache
        const waitUntil = Date.now() + FEED_BUILD_LOCK_WAIT_MS;
        while (Date.now() < waitUntil) {
            await sleep(FEED_BUILD_LOCK_POLL_MS);
            const waitedCache = await (0, FeedCacheService_1.getCachedFeed)(cacheKey);
            if (waitedCache)
                return waitedCache;
        }
    }
    try {
        // 3. Execution: Delegate to Query Engine
        const builtFeed = await (0, FeedQueryService_1.buildHomeFeed)(input, limit, parsedCursor);
        // 4. Persistence: Update Cache if still empty
        const existingCache = await (0, FeedCacheService_1.getCachedFeed)(cacheKey);
        if (!existingCache) {
            await (0, FeedCacheService_1.setFeedCache)(cacheKey, builtFeed, redisCache_1.CACHE_TTLS.HOME_FEED ?? HOME_FEED_CACHE_TTL_SECONDS);
        }
        const totalMs = Date.now() - startedAt;
        if (totalMs > 2000) {
            logger_1.default.warn('Home feed generation exceeded 2s target', { durationMs: totalMs, cacheKey });
        }
        return builtFeed;
    }
    finally {
        if (hasBuildLock) {
            await (0, FeedCacheService_1.releaseFeedBuildLock)(lockToken);
        }
    }
};
exports.getHomeFeedAds = getHomeFeedAds;
/**
 * Proactive Cache Warmup logic
 */
const warmHomeFeedCache = async () => {
    const startedAt = Date.now();
    const limit = DEFAULT_LIMIT;
    let warmedKeys = 0;
    let skippedKeys = 0;
    const getWarmLocationInputs = () => {
        const raw = env_1.env.HOME_FEED_WARM_LOCATIONS;
        return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
    };
    // 1. Warm Global Page 1 & 2
    const globalRequest = { limit };
    const globalPageOne = await (0, exports.getHomeFeedAds)(globalRequest);
    warmedKeys += 1;
    if (globalPageOne.nextCursor) {
        await (0, exports.getHomeFeedAds)({ ...globalRequest, cursor: globalPageOne.nextCursor });
        warmedKeys += 1;
    }
    // 2. Warm Top Locations
    const locations = getWarmLocationInputs();
    for (const location of locations) {
        const cacheKey = (0, FeedCacheService_1.buildHomeFeedCacheKey)({ location, limit }, null, limit);
        const cached = await (0, FeedCacheService_1.getCachedFeed)(cacheKey);
        if (cached) {
            skippedKeys += 1;
            continue;
        }
        await (0, exports.getHomeFeedAds)({ location, limit });
        warmedKeys += 1;
    }
    const durationMs = Date.now() - startedAt;
    logger_1.default.info('Home feed warmup completed', { warmedKeys, skippedKeys, durationMs });
    return { warmedKeys, skippedKeys, durationMs };
};
exports.warmHomeFeedCache = warmHomeFeedCache;
//# sourceMappingURL=FeedService.js.map