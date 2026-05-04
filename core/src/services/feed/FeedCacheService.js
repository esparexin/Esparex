"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeedCache = exports.getCachedFeed = exports.releaseFeedBuildLock = exports.tryAcquireFeedBuildLock = exports.buildHomeFeedCacheKey = void 0;
const redis_1 = __importDefault(require("@core/config/redis"));
const redisCache_1 = require("@core/utils/redisCache");
const FeedCursorService_1 = require("./FeedCursorService");
const FEED_BUILD_LOCK_KEY = 'feed:home:build-lock';
const FEED_BUILD_LOCK_TTL_SECONDS = 5;
const FEED_LOCK_RELEASE_SCRIPT = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end';
const buildHomeFeedCacheKey = (input, cursor, limit) => {
    const city = String(input.location || input.locationId || (input.lat && input.lng ? `${input.lat}_${input.lng}` : 'all')).trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
    const state = String(input.level === 'state' ? input.location : 'all').trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
    const radiusKm = input.radiusKm || (input.lat && input.lng ? 50 : 0);
    const category = String(input.categoryId || input.category || 'all').trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
    const sort = 'newest';
    const page = (0, FeedCursorService_1.toCursorKey)(cursor);
    return `home_feed:${city}:${state}:${radiusKm}:${category}:${sort}:${page}_${limit}`;
};
exports.buildHomeFeedCacheKey = buildHomeFeedCacheKey;
const tryAcquireFeedBuildLock = async (token) => {
    try {
        const acquired = await redis_1.default.set(FEED_BUILD_LOCK_KEY, token, 'EX', FEED_BUILD_LOCK_TTL_SECONDS, 'NX');
        return acquired === 'OK';
    }
    catch {
        return false;
    }
};
exports.tryAcquireFeedBuildLock = tryAcquireFeedBuildLock;
const releaseFeedBuildLock = async (token) => {
    try {
        await redis_1.default.eval(FEED_LOCK_RELEASE_SCRIPT, 1, FEED_BUILD_LOCK_KEY, token);
    }
    catch {
        // no-op
    }
};
exports.releaseFeedBuildLock = releaseFeedBuildLock;
const getCachedFeed = async (cacheKey) => {
    return (0, redisCache_1.getCache)(cacheKey);
};
exports.getCachedFeed = getCachedFeed;
const setFeedCache = async (cacheKey, data, ttlSeconds) => {
    await (0, redisCache_1.setCache)(cacheKey, data, ttlSeconds);
};
exports.setFeedCache = setFeedCache;
//# sourceMappingURL=FeedCacheService.js.map