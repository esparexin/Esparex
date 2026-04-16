import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { HomeFeedResponse } from '../../../shared/types/Api';
import logger from '../utils/logger';
import { CACHE_TTLS } from '../utils/redisCache';

// Leaf Services
import { 
    HomeFeedRequest, 
    parseCursor, 
    HomeFeedCursor 
} from './feed/FeedCursorService';
import { 
    buildHomeFeedCacheKey, 
    getCachedFeed, 
    setFeedCache, 
    tryAcquireFeedBuildLock, 
    releaseFeedBuildLock 
} from './feed/FeedCacheService';
import { buildHomeFeed } from './feed/FeedQueryService';

// Re-export core types for backward compatibility in controllers
export type { HomeFeedRequest, HomeFeedCursor };


const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 48;
const HOME_FEED_CACHE_TTL_SECONDS = 300;
const FEED_BUILD_LOCK_WAIT_MS = 1200;
const FEED_BUILD_LOCK_POLL_MS = 120;

const normalizePositiveInt = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
};

const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Main entry point for retrieving the home feed.
 * Features: Multi-level caching, Global build-lock (thundering herd protection),
 * Ranked merging, and fallback expansion logic.
 */
export const getHomeFeedAds = async (input: HomeFeedRequest = {}): Promise<HomeFeedResponse> => {
    const limit = Math.min(MAX_LIMIT, Math.max(1, normalizePositiveInt(input.limit, DEFAULT_LIMIT)));
    const parsedCursor = parseCursor(input.cursor);
    const cacheKey = buildHomeFeedCacheKey(input, parsedCursor, limit);
    const startedAt = Date.now();

    // 1. Layer 1: Cache Lookup
    const cached = await getCachedFeed(cacheKey);
    if (cached) {
        if (env.FEED_DEBUG) logger.debug(`[Feed:Cache] HIT: ${cacheKey}`);
        return cached;
    }

    if (env.FEED_DEBUG) logger.debug(`[Feed:Cache] MISS: ${cacheKey}`);

    // 2. Layer 2: Thundering Herd Protection (Mutex)
    const lockToken = randomUUID();
    const hasBuildLock = await tryAcquireFeedBuildLock(lockToken);

    if (!hasBuildLock) {
        // Wait for the lock-holder to finish and populate the cache
        const waitUntil = Date.now() + FEED_BUILD_LOCK_WAIT_MS;
        while (Date.now() < waitUntil) {
            await sleep(FEED_BUILD_LOCK_POLL_MS);
            const waitedCache = await getCachedFeed(cacheKey);
            if (waitedCache) return waitedCache;
        }
    }

    try {
        // 3. Execution: Delegate to Query Engine
        const builtFeed = await buildHomeFeed(input, limit, parsedCursor);
        
        // 4. Persistence: Update Cache if still empty
        const existingCache = await getCachedFeed(cacheKey);
        if (!existingCache) {
            await setFeedCache(
                cacheKey,
                builtFeed,
                CACHE_TTLS.HOME_FEED ?? HOME_FEED_CACHE_TTL_SECONDS
            );
        }

        const totalMs = Date.now() - startedAt;
        if (totalMs > 2000) {
            logger.warn('Home feed generation exceeded 2s target', { durationMs: totalMs, cacheKey });
        }

        return builtFeed;
    } finally {
        if (hasBuildLock) {
            await releaseFeedBuildLock(lockToken);
        }
    }
};

/**
 * Proactive Cache Warmup logic
 */
export const warmHomeFeedCache = async () => {
    const startedAt = Date.now();
    const limit = DEFAULT_LIMIT;
    let warmedKeys = 0;
    let skippedKeys = 0;

    const getWarmLocationInputs = (): string[] => {
        const raw = env.HOME_FEED_WARM_LOCATIONS;
        return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
    };

    // 1. Warm Global Page 1 & 2
    const globalRequest: HomeFeedRequest = { limit };
    const globalPageOne = await getHomeFeedAds(globalRequest);
    warmedKeys += 1;

    if (globalPageOne.nextCursor) {
        await getHomeFeedAds({ ...globalRequest, cursor: globalPageOne.nextCursor });
        warmedKeys += 1;
    }

    // 2. Warm Top Locations
    const locations = getWarmLocationInputs();
    for (const location of locations) {
        const cacheKey = buildHomeFeedCacheKey({ location, limit }, null, limit);
        const cached = await getCachedFeed(cacheKey);
        if (cached) {
            skippedKeys += 1;
            continue;
        }
        await getHomeFeedAds({ location, limit });
        warmedKeys += 1;
    }

    const durationMs = Date.now() - startedAt;
    logger.info('Home feed warmup completed', { warmedKeys, skippedKeys, durationMs });

    return { warmedKeys, skippedKeys, durationMs };
};
