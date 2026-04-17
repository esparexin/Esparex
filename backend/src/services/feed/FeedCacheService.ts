import redisClient from '../../config/redis';
import { getCache, setCache } from '../../utils/redisCache';
import { HomeFeedRequest, ParsedHomeFeedCursor, toCursorKey } from './FeedCursorService';
import { HomeFeedResponse } from '../../../../shared/types/Api';

const FEED_BUILD_LOCK_KEY = 'feed:home:build-lock';
const FEED_BUILD_LOCK_TTL_SECONDS = 5;
const FEED_LOCK_RELEASE_SCRIPT = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end';

export const buildHomeFeedCacheKey = (
    input: HomeFeedRequest,
    cursor: ParsedHomeFeedCursor | null,
    limit: number
): string => {
    const city = String(input.location || input.locationId || (input.lat && input.lng ? `${input.lat}_${input.lng}` : 'all')).trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
    const state = String(input.level === 'state' ? input.location : 'all').trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
    const radiusKm = input.radiusKm || (input.lat && input.lng ? 50 : 0);
    const category = String(input.categoryId || input.category || 'all').trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
    const sort = 'newest';
    const page = toCursorKey(cursor);
    return `home_feed:${city}:${state}:${radiusKm}:${category}:${sort}:${page}_${limit}`;
};

export const tryAcquireFeedBuildLock = async (token: string): Promise<boolean> => {
    try {
        const acquired = await redisClient.set(
            FEED_BUILD_LOCK_KEY,
            token,
            'EX',
            FEED_BUILD_LOCK_TTL_SECONDS,
            'NX'
        );
        return acquired === 'OK';
    } catch {
        return false;
    }
};

export const releaseFeedBuildLock = async (token: string): Promise<void> => {
    try {
        await redisClient.eval(
            FEED_LOCK_RELEASE_SCRIPT,
            1,
            FEED_BUILD_LOCK_KEY,
            token
        );
    } catch {
        // no-op
    }
};

export const getCachedFeed = async (cacheKey: string): Promise<HomeFeedResponse | null> => {
    return getCache<HomeFeedResponse>(cacheKey);
};

export const setFeedCache = async (cacheKey: string, data: HomeFeedResponse, ttlSeconds: number): Promise<void> => {
    await setCache(cacheKey, data, ttlSeconds);
};
