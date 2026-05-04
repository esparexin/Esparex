"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheStats = exports.delCache = exports.getRedisHealthProbe = exports.invalidateLocationCaches = exports.invalidatePublicAdCache = exports.invalidateAdFeedCaches = exports.clearCachePattern = exports.scanKeysByPattern = exports.setMultiCache = exports.getMultiCache = exports.setCache = exports.getCache = exports.isTokenBlacklisted = exports.blacklistToken = exports.buildDeterministicSearchCacheKey = exports.CACHE_TTLS = exports.CACHE_KEYS = exports.CACHE_NAMESPACES = exports.isHighMemoryPressure = exports.isConnected = exports.cacheMetrics = void 0;
const redis_1 = __importDefault(require("@core/config/redis"));
const logger_1 = __importDefault(require("./logger"));
const env_1 = require("@core/config/env");
/* ============================================================================
 * 📊 CACHE METRICS (In-Memory)
 * ========================================================================== */
exports.cacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    keys: 0,
    memory: 0,
    lastUpdated: new Date()
};
/* ============================================================================
 * 🔌 REDIS CLIENT SETUP (SSOT)
 * ========================================================================== */
const REDIS_MODE = env_1.env.REDIS_MODE;
const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
const shouldDisableRedis = (env_1.env.NODE_ENV === 'test' || isJestRuntime) && !env_1.env.ALLOW_REDIS;
const client = redis_1.default;
exports.isConnected = false;
exports.isHighMemoryPressure = false;
if (!shouldDisableRedis) {
    client.on('error', (err) => {
        const message = err instanceof Error ? err.message : String(err);
        if (exports.isConnected)
            logger_1.default.error('🔴 Redis Error in Cache:', message);
        exports.cacheMetrics.errors++;
        exports.isConnected = false;
    });
    client.on('connect', () => {
        exports.isConnected = true;
    });
    client.on('reconnecting', () => {
        exports.isConnected = false;
    });
}
/* ============================================================================
 * 🔑 CACHE KEY GOVERNANCE (SSOT REGISTRY)
 * ========================================================================== */
exports.CACHE_NAMESPACES = {
    SEARCH: 'search',
    SEARCH_ADS: 'search:ads',
    ADS_HOME: 'ads:home',
    LOCATION: 'location',
    USER: 'user',
    BLACKLIST: 'blacklist',
    RATE_LIMIT: 'rl',
    SCHEDULER: 'scheduler',
    SYSTEM: 'system'
};
exports.CACHE_KEYS = {
    DEFAULT_INDIA: 'location:default:india',
    CATEGORIES: 'catalog:categories:all',
    // Dynamic keys
    metadata: (type, id) => `meta:${type}:${id}`,
    searchCity: (query) => `loc_search:${query.toLowerCase().trim()}`,
    nearbyCity: (latRounded, lngRounded) => `location:nearby:city:${latRounded}:${lngRounded}`,
    reverseGeocode: (latRounded, lngRounded) => `geo:${latRounded}:${lngRounded}`
};
exports.CACHE_TTLS = {
    CITY_SEARCH: 3600, // 1 Hour
    NEARBY_LOOKUP: 21600, // 6 Hours
    REVERSE_GEOCODE: 3600, // 1 Hour
    DEFAULT_INDIA: 604800, // 7 Days
    CATEGORIES: 3600, // 1 Hour
    HOME_PAGE: 1800, // 30 Minutes
    HOME_FEED: 300, // 5 Minutes (was 60s — too short for meaningful reuse)
    SEARCH: 300 // 5 Minutes
};
const REDIS_SCAN_BATCH_SIZE = 200;
const REDIS_DELETE_BATCH_SIZE = 500;
const REDIS_HEALTH_PROBE_TTL_SECONDS = 5;
const REDIS_TTL_AUDIT_SAMPLE_LIMIT = 200;
const REDIS_MEMORY_PRESSURE_THRESHOLD = 0.7;
const RECOMMENDED_REDIS_EVICTION_POLICY = 'allkeys-lru';
let lastRedisConfigWarningSignature = null;
const GOVERNED_CACHE_PATTERNS = [
    'feed:*:home:*',
    `${exports.CACHE_NAMESPACES.SEARCH}:*`,
    `${exports.CACHE_NAMESPACES.ADS_HOME}:*`,
    `${exports.CACHE_NAMESPACES.LOCATION}:*`,
    `${exports.CACHE_NAMESPACES.USER}:*`,
    `${exports.CACHE_NAMESPACES.BLACKLIST}:*`,
    `${exports.CACHE_NAMESPACES.RATE_LIMIT}:*`,
    `${exports.CACHE_NAMESPACES.SCHEDULER}:*`,
    `${exports.CACHE_NAMESPACES.SYSTEM}:*`
];
const parseInfoNumberMetric = (info, metric) => {
    const match = info.match(new RegExp(`${metric}:(\\d+)`));
    if (!match)
        return null;
    const parsed = parseInt(match[1] ?? '0', 10);
    return Number.isFinite(parsed) ? parsed : null;
};
const parseInfoStringMetric = (info, metric) => {
    const match = info.match(new RegExp(`${metric}:([^\\r\\n]+)`));
    return match && match[1] ? match[1].trim() : null;
};
const getDefaultTtlForKey = (key) => {
    if (/^feed:v[0-9]+:home:/.test(key))
        return exports.CACHE_TTLS.HOME_FEED;
    if (key.startsWith(`${exports.CACHE_NAMESPACES.ADS_HOME}:`))
        return exports.CACHE_TTLS.HOME_PAGE;
    if (key.startsWith(`${exports.CACHE_NAMESPACES.SEARCH_ADS}:`))
        return exports.CACHE_TTLS.SEARCH;
    if (key.startsWith(`${exports.CACHE_NAMESPACES.SEARCH}:{`))
        return exports.CACHE_TTLS.SEARCH;
    if (key.startsWith('loc_search:'))
        return exports.CACHE_TTLS.CITY_SEARCH;
    if (key.startsWith(`${exports.CACHE_NAMESPACES.LOCATION}:search:city:`))
        return exports.CACHE_TTLS.CITY_SEARCH;
    if (key.startsWith(`${exports.CACHE_NAMESPACES.LOCATION}:`))
        return exports.CACHE_TTLS.CITY_SEARCH;
    if (key.startsWith('user:status:'))
        return 300;
    if (key.startsWith('blacklist:token:'))
        return 3600;
    if (key.startsWith(`${exports.CACHE_NAMESPACES.RATE_LIMIT}:`))
        return 900;
    if (key.startsWith(`${exports.CACHE_NAMESPACES.SCHEDULER}:metrics:lock:`))
        return 8 * 24 * 60 * 60;
    if (key.startsWith(`${exports.CACHE_NAMESPACES.SYSTEM}:config:`))
        return 120;
    return null;
};
const normalizeQueryValue = (value) => {
    if (value === null || value === undefined)
        return null;
    if (Array.isArray(value)) {
        const serializedArray = value
            .map((entry) => normalizeQueryValue(entry))
            .filter((entry) => Boolean(entry))
            .sort();
        return serializedArray.length > 0 ? serializedArray.join(',') : null;
    }
    if (typeof value === 'object') {
        try {
            const sorted = Object.keys(value)
                .sort()
                .reduce((acc, key) => {
                acc[key] = value[key];
                return acc;
            }, {});
            return JSON.stringify(sorted);
        }
        catch {
            return null;
        }
    }
    const asString = String(value).trim();
    return asString.length > 0 ? asString : null;
};
const buildDeterministicSearchCacheKey = (query) => {
    const segments = Object.keys(query)
        .sort()
        .map((key) => {
        const normalizedValue = normalizeQueryValue(query[key]);
        if (!normalizedValue)
            return null;
        return `${key}=${encodeURIComponent(normalizedValue)}`;
    })
        .filter((segment) => Boolean(segment));
    return segments.length > 0
        ? `${exports.CACHE_NAMESPACES.SEARCH_ADS}:${segments.join(':')}`
        : `${exports.CACHE_NAMESPACES.SEARCH_ADS}:default`;
};
exports.buildDeterministicSearchCacheKey = buildDeterministicSearchCacheKey;
/* ============================================================================
 * 🧠 INTELLIGENCE & SAFETY
 * ========================================================================== */
/**
 * Check Memory Health
 * Sets isHighMemoryPressure flag if memory usage > 70%
 */
const checkMemoryHealth = async () => {
    if (!exports.isConnected)
        return;
    try {
        const info = await client.info('memory');
        const used = parseInfoNumberMetric(info, 'used_memory') ?? 0;
        const max = parseInfoNumberMetric(info, 'maxmemory') ?? 0;
        const maxMemoryPolicy = parseInfoStringMetric(info, 'maxmemory_policy') || 'unknown';
        if (max > 0) {
            const ratio = used / max;
            exports.isHighMemoryPressure = ratio > REDIS_MEMORY_PRESSURE_THRESHOLD;
        }
        else {
            exports.isHighMemoryPressure = false;
        }
        if (env_1.env.NODE_ENV === 'production') {
            const configWarnings = [];
            if (max <= 0) {
                configWarnings.push('maxmemory is not configured');
            }
            if (maxMemoryPolicy !== RECOMMENDED_REDIS_EVICTION_POLICY) {
                configWarnings.push(`maxmemory_policy is ${maxMemoryPolicy} (recommended: ${RECOMMENDED_REDIS_EVICTION_POLICY})`);
            }
            const warningSignature = configWarnings.join(' | ');
            if (warningSignature && warningSignature !== lastRedisConfigWarningSignature) {
                logger_1.default.warn(`[REDIS_CONFIG] ${warningSignature}`);
                lastRedisConfigWarningSignature = warningSignature;
            }
            if (!warningSignature) {
                lastRedisConfigWarningSignature = null;
            }
        }
    }
    catch {
        // Silent fail
    }
};
// Check memory every 5 minutes
setInterval(() => void checkMemoryHealth(), 300000).unref();
/* ============================================================================
 * 🛡️ TOKEN REPLAY BLACKLIST
 * ========================================================================== */
const blacklistToken = async (jti, exp) => {
    if (!exports.isConnected || !jti)
        return;
    try {
        const now = Math.floor(Date.now() / 1000);
        const ttl = exp - now;
        if (ttl > 0) {
            await client.set(`blacklist:token:${jti}`, 'revoked', 'EX', ttl);
        }
    }
    catch (e) {
        logger_1.default.error('Failed to blacklist JWT in Redis', e);
    }
};
exports.blacklistToken = blacklistToken;
const isTokenBlacklisted = async (jti) => {
    if (!exports.isConnected || !jti)
        return false;
    try {
        const res = await client.get(`blacklist:token:${jti}`);
        return res === 'revoked';
    }
    catch {
        return false;
    }
};
exports.isTokenBlacklisted = isTokenBlacklisted;
/**
 * Calculate Hit Rate Status
 */
const getHitRateStatus = () => {
    const total = exports.cacheMetrics.hits + exports.cacheMetrics.misses;
    if (total === 0)
        return 'healthy';
    const rate = exports.cacheMetrics.hits / total;
    if (rate < 0.5)
        return 'critical';
    if (rate < 0.7)
        return 'warning';
    return 'healthy';
};
/* ============================================================================
 * 🛠️ REDIS HELPER METHODS (Safe Fallback)
 * ========================================================================== */
/**
 * Get item from cache
 * Returns null if cache miss or Redis error
 */
const getCache = async (key) => {
    if (!exports.isConnected)
        return null;
    try {
        const data = await client.get(key);
        if (data) {
            exports.cacheMetrics.hits++;
            return JSON.parse(data);
        }
    }
    catch {
        exports.cacheMetrics.errors++;
    }
    exports.cacheMetrics.misses++;
    return null;
};
exports.getCache = getCache;
/**
 * Set item in cache
 * TTL is in seconds
 */
const setCache = async (key, value, ttlSeconds = 3600) => {
    if (!exports.isConnected)
        return false;
    // 🛡️ MEMORY PRESSURE GUARD
    // If pressure is high, reduce TTL by half to encourage eviction
    const safeTTL = Math.max(1, ttlSeconds);
    const finalTTL = exports.isHighMemoryPressure ? Math.max(1, Math.floor(safeTTL / 2)) : safeTTL;
    try {
        // ioredis set options: key, value, 'EX', ttl
        await client.set(key, JSON.stringify(value), 'EX', finalTTL);
        return true;
    }
    catch {
        exports.cacheMetrics.errors++;
        return false;
    }
};
exports.setCache = setCache;
/**
 * Get multiple items from cache using MGET
 */
const getMultiCache = async (keys) => {
    if (!exports.isConnected || keys.length === 0)
        return keys.map(() => null);
    try {
        const results = await client.mget(...keys);
        return results.map(data => {
            if (data) {
                exports.cacheMetrics.hits++;
                try {
                    return JSON.parse(data);
                }
                catch {
                    return null;
                }
            }
            exports.cacheMetrics.misses++;
            return null;
        });
    }
    catch {
        exports.cacheMetrics.errors++;
        return keys.map(() => null);
    }
};
exports.getMultiCache = getMultiCache;
/**
 * Set multiple items in cache using MSET with shared TTL (pipelined)
 */
const setMultiCache = async (entries, ttlSeconds = 3600) => {
    if (!exports.isConnected || entries.length === 0)
        return false;
    try {
        const pipeline = client.pipeline();
        entries.forEach(entry => {
            pipeline.set(entry.key, JSON.stringify(entry.value), 'EX', ttlSeconds);
        });
        await pipeline.exec();
        return true;
    }
    catch {
        exports.cacheMetrics.errors++;
        return false;
    }
};
exports.setMultiCache = setMultiCache;
const deleteKeysInBatches = async (keys) => {
    if (!exports.isConnected || keys.length === 0)
        return 0;
    let deleted = 0;
    for (let index = 0; index < keys.length; index += REDIS_DELETE_BATCH_SIZE) {
        const chunk = keys.slice(index, index + REDIS_DELETE_BATCH_SIZE);
        if (chunk.length === 0)
            continue;
        try {
            deleted += await client.del(...chunk);
        }
        catch {
            exports.cacheMetrics.errors++;
        }
    }
    return deleted;
};
const scanKeysByPattern = async (pattern, options = {}) => {
    if (!exports.isConnected)
        return [];
    const count = Math.max(10, options.count ?? REDIS_SCAN_BATCH_SIZE);
    const maxKeys = Math.max(1, options.maxKeys ?? Number.MAX_SAFE_INTEGER);
    const collected = [];
    let cursor = '0';
    try {
        do {
            const rawResult = await client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
            const nextCursor = Array.isArray(rawResult) ? rawResult[0] : '0';
            const batch = Array.isArray(rawResult) ? (rawResult[1]) : [];
            if (Array.isArray(batch) && batch.length > 0) {
                collected.push(...batch);
            }
            cursor = String(nextCursor);
            if (collected.length >= maxKeys) {
                return collected.slice(0, maxKeys);
            }
        } while (cursor !== '0');
    }
    catch {
        exports.cacheMetrics.errors++;
        return [];
    }
    return collected;
};
exports.scanKeysByPattern = scanKeysByPattern;
/**
 * Delete keys by pattern using SCAN (non-blocking for production safety).
 */
const clearCachePattern = async (pattern, options = {}) => {
    if (!exports.isConnected)
        return 0;
    const keys = await (0, exports.scanKeysByPattern)(pattern, options);
    return deleteKeysInBatches(keys);
};
exports.clearCachePattern = clearCachePattern;
const invalidateAdFeedCaches = async () => {
    await Promise.all([
        (0, exports.clearCachePattern)('home_feed:*'),
        (0, exports.clearCachePattern)('spotlight:*'),
        (0, exports.clearCachePattern)('feed:*:home:*'),
        (0, exports.clearCachePattern)(`${exports.CACHE_NAMESPACES.ADS_HOME}:*`),
        // Canonical search namespace invalidation (covers search:ads:* and legacy search:{...} keys).
        (0, exports.clearCachePattern)(`${exports.CACHE_NAMESPACES.SEARCH}:*`)
    ]);
};
exports.invalidateAdFeedCaches = invalidateAdFeedCaches;
const invalidatePublicAdCache = async (adId) => {
    const normalizedId = String(adId ?? '').trim();
    if (!normalizedId)
        return;
    await (0, exports.delCache)(`ad:public:${normalizedId}`);
};
exports.invalidatePublicAdCache = invalidatePublicAdCache;
const invalidateLocationCaches = async () => {
    await Promise.all([
        (0, exports.clearCachePattern)(`${exports.CACHE_NAMESPACES.LOCATION}:search:city:*`)
    ]);
};
exports.invalidateLocationCaches = invalidateLocationCaches;
const buildProbeKey = () => `${exports.CACHE_NAMESPACES.SYSTEM}:health:probe:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
const getRedisHealthProbe = async () => {
    if (!exports.isConnected) {
        return {
            connected: false,
            pingOk: false,
            roundTripOk: false,
            latencyMs: null,
            error: 'Redis client is disconnected'
        };
    }
    const probeKey = buildProbeKey();
    const probeValue = Date.now().toString(36);
    const startedAt = Date.now();
    try {
        const pong = await client.ping();
        const pingOk = pong === 'PONG';
        await client.set(probeKey, probeValue, 'EX', REDIS_HEALTH_PROBE_TTL_SECONDS);
        const readBack = await client.get(probeKey);
        await client.del(probeKey);
        const roundTripOk = readBack === probeValue;
        return {
            connected: true,
            pingOk,
            roundTripOk,
            latencyMs: Date.now() - startedAt
        };
    }
    catch (error) {
        exports.cacheMetrics.errors++;
        return {
            connected: true,
            pingOk: false,
            roundTripOk: false,
            latencyMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error)
        };
    }
};
exports.getRedisHealthProbe = getRedisHealthProbe;
/**
 * Delete a specific key from cache
 */
const delCache = async (key) => {
    if (!exports.isConnected)
        return false;
    try {
        await client.del(key);
        return true;
    }
    catch {
        exports.cacheMetrics.errors++;
        return false;
    }
};
exports.delCache = delCache;
const auditKeyTtl = async (key) => {
    try {
        const ttl = await client.ttl(key);
        if (ttl === -1) {
            const fallbackTtl = getDefaultTtlForKey(key);
            if (fallbackTtl && fallbackTtl > 0) {
                const repaired = await client.expire(key, fallbackTtl);
                if (repaired === 1) {
                    return { ttl: fallbackTtl, autoFixed: true };
                }
            }
        }
        return { ttl, autoFixed: false };
    }
    catch {
        exports.cacheMetrics.errors++;
        return { ttl: null, autoFixed: false };
    }
};
/**
 * Get Cache Health Stats (Admin Only)
 */
const getCacheStats = async () => {
    let memoryUsedBytes = 0;
    let totalKeys = 0;
    let maxMemoryBytes = 0;
    let maxMemoryPolicy = 'unknown';
    let ttlAudit = {
        sampledKeys: 0,
        keysWithoutTtl: 0,
        keysAutoFixed: 0
    };
    const redisHealth = await (0, exports.getRedisHealthProbe)();
    if (exports.isConnected) {
        try {
            // Memory Info
            const info = await client.info('memory');
            memoryUsedBytes = parseInfoNumberMetric(info, 'used_memory') ?? 0;
            maxMemoryBytes = parseInfoNumberMetric(info, 'maxmemory') ?? 0;
            maxMemoryPolicy = parseInfoStringMetric(info, 'maxmemory_policy') || 'unknown';
            // DB Size
            totalKeys = await client.dbsize(); // ioredis uses lowercase dbsize
            await checkMemoryHealth(); // Force check
            const sampled = new Set();
            for (const pattern of GOVERNED_CACHE_PATTERNS) {
                const keys = await (0, exports.scanKeysByPattern)(pattern, { count: 100, maxKeys: 50 });
                for (const key of keys) {
                    sampled.add(key);
                    if (sampled.size >= REDIS_TTL_AUDIT_SAMPLE_LIMIT) {
                        break;
                    }
                }
                if (sampled.size >= REDIS_TTL_AUDIT_SAMPLE_LIMIT) {
                    break;
                }
            }
            const sampledKeys = Array.from(sampled);
            if (sampledKeys.length > 0) {
                let keysAutoFixed = 0;
                const results = await Promise.all(sampledKeys.map(key => auditKeyTtl(key)));
                for (const res of results) {
                    if (res.autoFixed)
                        keysAutoFixed += 1;
                }
                const ttlValues = results.map(res => res.ttl);
                ttlAudit = {
                    sampledKeys: sampledKeys.length,
                    keysWithoutTtl: ttlValues.filter((ttl) => ttl === -1).length,
                    keysAutoFixed
                };
            }
        }
        catch { }
    }
    return {
        connected: exports.isConnected,
        mode: REDIS_MODE,
        namespaces: exports.CACHE_NAMESPACES,
        redisHealth,
        redisConfig: {
            maxMemoryBytes,
            maxMemoryPolicy,
            evictionPolicyRecommended: RECOMMENDED_REDIS_EVICTION_POLICY,
            isRecommendedPolicy: maxMemoryPolicy === RECOMMENDED_REDIS_EVICTION_POLICY,
        },
        metrics: {
            ...exports.cacheMetrics,
            memoryUsedMB: Number((memoryUsedBytes / (1024 * 1024)).toFixed(2)),
            totalKeys,
            ttlAudit,
            lastUpdated: new Date(),
        },
        healthStatus: getHitRateStatus(),
        memoryPressureStatus: exports.isHighMemoryPressure ? 'critical' : 'normal',
    };
};
exports.getCacheStats = getCacheStats;
// Log cache metrics every 60 seconds
setInterval(() => {
    if (exports.isConnected) {
        const total = exports.cacheMetrics.hits + exports.cacheMetrics.misses;
        if (total > 0) {
            const rate = ((exports.cacheMetrics.hits / total) * 100).toFixed(2);
            logger_1.default.info(`[REDIS_METRICS] Hit Rate: ${rate}% | Hits: ${exports.cacheMetrics.hits} | Misses: ${exports.cacheMetrics.misses}`);
        }
    }
}, 60000).unref();
exports.default = client;
//# sourceMappingURL=redisCache.js.map