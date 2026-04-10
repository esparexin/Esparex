import redisClient from '../config/redis';
import logger from './logger';

/* ============================================================================
 * 📊 CACHE METRICS (In-Memory)
 * ========================================================================== */
export const cacheMetrics = {
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
const REDIS_MODE = process.env.REDIS_MODE || 'single';
const shouldDisableRedis = process.env.NODE_ENV === 'test' && process.env.ALLOW_REDIS !== 'true';

const client = redisClient;

export let isConnected = false;
export let isHighMemoryPressure = false;

if (!shouldDisableRedis) {
    client.on('error', (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        if (isConnected) logger.error('🔴 Redis Error in Cache:', message);
        cacheMetrics.errors++;
        isConnected = false;
    });

    client.on('connect', () => {
        isConnected = true;
    });

    client.on('reconnecting', () => {
        isConnected = false;
    });
}

/* ============================================================================
 * 🔑 CACHE KEY GOVERNANCE (SSOT REGISTRY)
 * ========================================================================== */
export const CACHE_NAMESPACES = {
    SEARCH: 'search',
    SEARCH_ADS: 'search:ads',
    ADS_HOME: 'ads:home',
    LOCATION: 'location',
    USER: 'user',
    BLACKLIST: 'blacklist',
    RATE_LIMIT: 'rl',
    SCHEDULER: 'scheduler',
    SYSTEM: 'system'
} as const;

export const CACHE_KEYS = {
    DEFAULT_INDIA: 'location:default:india',
    CATEGORIES: 'catalog:categories:all',
    // Dynamic keys
    searchCity: (query: string) => `loc_search:${query.toLowerCase().trim()}`,
    nearbyCity: (latRounded: number, lngRounded: number) => `location:nearby:city:${latRounded}:${lngRounded}`,
    reverseGeocode: (latRounded: string, lngRounded: string) => `geo:${latRounded}:${lngRounded}`
};

export const CACHE_TTLS = {
    CITY_SEARCH: 3600,        // 1 Hour
    NEARBY_LOOKUP: 21600,     // 6 Hours
    REVERSE_GEOCODE: 3600,    // 1 Hour
    DEFAULT_INDIA: 604800,    // 7 Days
    CATEGORIES: 3600,         // 1 Hour
    HOME_PAGE: 1800,          // 30 Minutes
    HOME_FEED: 300,           // 5 Minutes (was 60s — too short for meaningful reuse)
    SEARCH: 300               // 5 Minutes
};

const REDIS_SCAN_BATCH_SIZE = 200;
const REDIS_DELETE_BATCH_SIZE = 500;
const REDIS_HEALTH_PROBE_TTL_SECONDS = 5;
const REDIS_TTL_AUDIT_SAMPLE_LIMIT = 200;
const REDIS_MEMORY_PRESSURE_THRESHOLD = 0.7;
const RECOMMENDED_REDIS_EVICTION_POLICY = 'allkeys-lru';

let lastRedisConfigWarningSignature: string | null = null;

const GOVERNED_CACHE_PATTERNS: ReadonlyArray<string> = [
    'feed:*:home:*',
    `${CACHE_NAMESPACES.SEARCH}:*`,
    `${CACHE_NAMESPACES.ADS_HOME}:*`,
    `${CACHE_NAMESPACES.LOCATION}:*`,
    `${CACHE_NAMESPACES.USER}:*`,
    `${CACHE_NAMESPACES.BLACKLIST}:*`,
    `${CACHE_NAMESPACES.RATE_LIMIT}:*`,
    `${CACHE_NAMESPACES.SCHEDULER}:*`,
    `${CACHE_NAMESPACES.SYSTEM}:*`
];

const parseInfoNumberMetric = (info: string, metric: string): number | null => {
    const match = info.match(new RegExp(`${metric}:(\\d+)`));
    if (!match) return null;
    const parsed = parseInt(match[1] ?? '0', 10);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseInfoStringMetric = (info: string, metric: string): string | null => {
    const match = info.match(new RegExp(`${metric}:([^\\r\\n]+)`));
    return match && match[1] ? match[1].trim() : null;
};

const getDefaultTtlForKey = (key: string): number | null => {
    if (/^feed:v[0-9]+:home:/.test(key)) return CACHE_TTLS.HOME_FEED;
    if (key.startsWith(`${CACHE_NAMESPACES.ADS_HOME}:`)) return CACHE_TTLS.HOME_PAGE;
    if (key.startsWith(`${CACHE_NAMESPACES.SEARCH_ADS}:`)) return CACHE_TTLS.SEARCH;
    if (key.startsWith(`${CACHE_NAMESPACES.SEARCH}:{`)) return CACHE_TTLS.SEARCH;
    if (key.startsWith('loc_search:')) return CACHE_TTLS.CITY_SEARCH;
    if (key.startsWith(`${CACHE_NAMESPACES.LOCATION}:search:city:`)) return CACHE_TTLS.CITY_SEARCH;
    if (key.startsWith(`${CACHE_NAMESPACES.LOCATION}:`)) return CACHE_TTLS.CITY_SEARCH;
    if (key.startsWith('user:status:')) return 300;
    if (key.startsWith('blacklist:token:')) return 3600;
    if (key.startsWith(`${CACHE_NAMESPACES.RATE_LIMIT}:`)) return 900;
    if (key.startsWith(`${CACHE_NAMESPACES.SCHEDULER}:metrics:lock:`)) return 8 * 24 * 60 * 60;
    if (key.startsWith(`${CACHE_NAMESPACES.SYSTEM}:config:`)) return 120;
    return null;
};

const normalizeQueryValue = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) {
        const serializedArray = value
            .map((entry) => normalizeQueryValue(entry))
            .filter((entry): entry is string => Boolean(entry))
            .sort();
        return serializedArray.length > 0 ? serializedArray.join(',') : null;
    }
    if (typeof value === 'object') {
        try {
            const sorted = Object.keys(value as Record<string, unknown>)
                .sort()
                .reduce<Record<string, unknown>>((acc, key) => {
                    acc[key] = (value as Record<string, unknown>)[key];
                    return acc;
                }, {});
            return JSON.stringify(sorted);
        } catch {
            return null;
        }
    }
    const asString = String(value).trim();
    return asString.length > 0 ? asString : null;
};

export const buildDeterministicSearchCacheKey = (query: Record<string, unknown>): string => {
    const segments = Object.keys(query)
        .sort()
        .map((key) => {
            const normalizedValue = normalizeQueryValue(query[key]);
            if (!normalizedValue) return null;
            return `${key}=${encodeURIComponent(normalizedValue)}`;
        })
        .filter((segment): segment is string => Boolean(segment));

    return segments.length > 0
        ? `${CACHE_NAMESPACES.SEARCH_ADS}:${segments.join(':')}`
        : `${CACHE_NAMESPACES.SEARCH_ADS}:default`;
};

/* ============================================================================
 * 🧠 INTELLIGENCE & SAFETY
 * ========================================================================== */

/**
 * Check Memory Health
 * Sets isHighMemoryPressure flag if memory usage > 70%
 */
const checkMemoryHealth = async () => {
    if (!isConnected) return;
    try {
        const info = await client.info('memory');
        const used = parseInfoNumberMetric(info, 'used_memory') ?? 0;
        const max = parseInfoNumberMetric(info, 'maxmemory') ?? 0;
        const maxMemoryPolicy = parseInfoStringMetric(info, 'maxmemory_policy') || 'unknown';

        if (max > 0) {
            const ratio = used / max;
            isHighMemoryPressure = ratio > REDIS_MEMORY_PRESSURE_THRESHOLD;
        } else {
            isHighMemoryPressure = false;
        }

        if (process.env.NODE_ENV === 'production') {
            const configWarnings: string[] = [];
            if (max <= 0) {
                configWarnings.push('maxmemory is not configured');
            }
            if (maxMemoryPolicy !== RECOMMENDED_REDIS_EVICTION_POLICY) {
                configWarnings.push(`maxmemory_policy is ${maxMemoryPolicy} (recommended: ${RECOMMENDED_REDIS_EVICTION_POLICY})`);
            }

            const warningSignature = configWarnings.join(' | ');
            if (warningSignature && warningSignature !== lastRedisConfigWarningSignature) {
                logger.warn(`[REDIS_CONFIG] ${warningSignature}`);
                lastRedisConfigWarningSignature = warningSignature;
            }
            if (!warningSignature) {
                lastRedisConfigWarningSignature = null;
            }
        }
    } catch {
        // Silent fail
    }
};

// Check memory every 5 minutes
setInterval(checkMemoryHealth, 300000);

/* ============================================================================
 * 🛡️ TOKEN REPLAY BLACKLIST
 * ========================================================================== */
export const blacklistToken = async (jti: string, exp: number) => {
    if (!isConnected || !jti) return;
    try {
        const now = Math.floor(Date.now() / 1000);
        const ttl = exp - now;
        if (ttl > 0) {
            await client.set(`blacklist:token:${jti}`, 'revoked', 'EX', ttl);
        }
    } catch (e) {
        logger.error('Failed to blacklist JWT in Redis', e);
    }
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
    if (!isConnected || !jti) return false;
    try {
        const res = await client.get(`blacklist:token:${jti}`);
        return res === 'revoked';
    } catch {
        return false;
    }
};

/**
 * Calculate Hit Rate Status
 */
const getHitRateStatus = () => {
    const total = cacheMetrics.hits + cacheMetrics.misses;
    if (total === 0) return 'healthy';

    const rate = cacheMetrics.hits / total;
    if (rate < 0.5) return 'critical';
    if (rate < 0.7) return 'warning';
    return 'healthy';
};

/* ============================================================================
 * 🛠️ REDIS HELPER METHODS (Safe Fallback)
 * ========================================================================== */

/**
 * Get item from cache
 * Returns null if cache miss or Redis error
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
    if (!isConnected) return null;

    try {
        const data = await client.get(key);
        if (data) {
            cacheMetrics.hits++;
            return JSON.parse(data) as T;
        }
    } catch {
        cacheMetrics.errors++;
    }

    cacheMetrics.misses++;
    return null;
};

/**
 * Set item in cache
 * TTL is in seconds
 */
export const setCache = async (key: string, value: unknown, ttlSeconds: number = 3600): Promise<boolean> => {
    if (!isConnected) return false;

    // 🛡️ MEMORY PRESSURE GUARD
    // If pressure is high, reduce TTL by half to encourage eviction
    const safeTTL = Math.max(1, ttlSeconds);
    const finalTTL = isHighMemoryPressure ? Math.max(1, Math.floor(safeTTL / 2)) : safeTTL;

    try {
        // ioredis set options: key, value, 'EX', ttl
        await client.set(key, JSON.stringify(value), 'EX', finalTTL);
        return true;
    } catch {
        cacheMetrics.errors++;
        return false;
    }
};

const deleteKeysInBatches = async (keys: string[]): Promise<number> => {
    if (!isConnected || keys.length === 0) return 0;
    let deleted = 0;

    for (let index = 0; index < keys.length; index += REDIS_DELETE_BATCH_SIZE) {
        const chunk = keys.slice(index, index + REDIS_DELETE_BATCH_SIZE);
        if (chunk.length === 0) continue;
        try {
            deleted += await client.del(...chunk);
        } catch {
            cacheMetrics.errors++;
        }
    }

    return deleted;
};

export const scanKeysByPattern = async (
    pattern: string,
    options: { count?: number; maxKeys?: number } = {}
): Promise<string[]> => {
    if (!isConnected) return [];

    const count = Math.max(10, options.count ?? REDIS_SCAN_BATCH_SIZE);
    const maxKeys = Math.max(1, options.maxKeys ?? Number.MAX_SAFE_INTEGER);
    const collected: string[] = [];
    let cursor = '0';

    try {
        do {
            const rawResult = await client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
            const nextCursor = Array.isArray(rawResult) ? rawResult[0] : '0';
            const batch = Array.isArray(rawResult) ? (rawResult[1] as string[]) : [];
            if (Array.isArray(batch) && batch.length > 0) {
                collected.push(...batch);
            }
            cursor = String(nextCursor);

            if (collected.length >= maxKeys) {
                return collected.slice(0, maxKeys);
            }
        } while (cursor !== '0');
    } catch {
        cacheMetrics.errors++;
        return [];
    }

    return collected;
};

/**
 * Delete keys by pattern using SCAN (non-blocking for production safety).
 */
export const clearCachePattern = async (
    pattern: string,
    options: { count?: number; maxKeys?: number } = {}
): Promise<number> => {
    if (!isConnected) return 0;
    const keys = await scanKeysByPattern(pattern, options);
    return deleteKeysInBatches(keys);
};

export const invalidateAdFeedCaches = async (): Promise<void> => {
    await Promise.all([
        clearCachePattern('home_feed:*'),
        clearCachePattern('spotlight:*'),
        clearCachePattern('feed:*:home:*'),
        clearCachePattern(`${CACHE_NAMESPACES.ADS_HOME}:*`),
        // Canonical search namespace invalidation (covers search:ads:* and legacy search:{...} keys).
        clearCachePattern(`${CACHE_NAMESPACES.SEARCH}:*`)
    ]);
};

export const invalidatePublicAdCache = async (
    adId: string | number | { toString(): string }
): Promise<void> => {
    const normalizedId = String(adId ?? '').trim();
    if (!normalizedId) return;
    await delCache(`ad:public:${normalizedId}`);
};

export const invalidateLocationCaches = async (): Promise<void> => {
    await Promise.all([
        clearCachePattern(`${CACHE_NAMESPACES.LOCATION}:search:city:*`)
    ]);
};

const buildProbeKey = (): string => `${CACHE_NAMESPACES.SYSTEM}:health:probe:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;

export const getRedisHealthProbe = async (): Promise<{
    connected: boolean;
    pingOk: boolean;
    roundTripOk: boolean;
    latencyMs: number | null;
    error?: string;
}> => {
    if (!isConnected) {
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
    } catch (error: unknown) {
        cacheMetrics.errors++;
        return {
            connected: true,
            pingOk: false,
            roundTripOk: false,
            latencyMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

/**
 * Delete a specific key from cache
 */
export const delCache = async (key: string): Promise<boolean> => {
    if (!isConnected) return false;
    try {
        await client.del(key);
        return true;
    } catch {
        cacheMetrics.errors++;
        return false;
    }
};

const auditKeyTtl = async (key: string): Promise<{ ttl: number | null; autoFixed: boolean }> => {
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
    } catch {
        cacheMetrics.errors++;
        return { ttl: null, autoFixed: false };
    }
};

/**
 * Get Cache Health Stats (Admin Only)
 */
export const getCacheStats = async () => {
    let memoryUsedBytes = 0;
    let totalKeys = 0;
    let maxMemoryBytes = 0;
    let maxMemoryPolicy = 'unknown';
    let ttlAudit = {
        sampledKeys: 0,
        keysWithoutTtl: 0,
        keysAutoFixed: 0
    };
    const redisHealth = await getRedisHealthProbe();

    if (isConnected) {
        try {
            // Memory Info
            const info = await client.info('memory');
            memoryUsedBytes = parseInfoNumberMetric(info, 'used_memory') ?? 0;
            maxMemoryBytes = parseInfoNumberMetric(info, 'maxmemory') ?? 0;
            maxMemoryPolicy = parseInfoStringMetric(info, 'maxmemory_policy') || 'unknown';

            // DB Size
            totalKeys = await client.dbsize(); // ioredis uses lowercase dbsize
            await checkMemoryHealth(); // Force check

            const sampled = new Set<string>();
            for (const pattern of GOVERNED_CACHE_PATTERNS) {
                const keys = await scanKeysByPattern(pattern, { count: 100, maxKeys: 50 });
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
                const results = await Promise.all(
                    sampledKeys.map(key => auditKeyTtl(key))
                );
                
                for (const res of results) {
                    if (res.autoFixed) keysAutoFixed += 1;
                }
                const ttlValues = results.map(res => res.ttl);

                ttlAudit = {
                    sampledKeys: sampledKeys.length,
                    keysWithoutTtl: ttlValues.filter((ttl) => ttl === -1).length,
                    keysAutoFixed
                };
            }
        } catch { }
    }

    return {
        connected: isConnected,
        mode: REDIS_MODE,
        namespaces: CACHE_NAMESPACES,
        redisHealth,
        redisConfig: {
            maxMemoryBytes,
            maxMemoryPolicy,
            evictionPolicyRecommended: RECOMMENDED_REDIS_EVICTION_POLICY,
            isRecommendedPolicy: maxMemoryPolicy === RECOMMENDED_REDIS_EVICTION_POLICY,
        },
        metrics: {
            ...cacheMetrics,
            memoryUsedMB: Number((memoryUsedBytes / (1024 * 1024)).toFixed(2)),
            totalKeys,
            ttlAudit,
            lastUpdated: new Date(),
        },
        healthStatus: getHitRateStatus(),
        memoryPressureStatus: isHighMemoryPressure ? 'critical' : 'normal',
    };
};

// Log cache metrics every 60 seconds
setInterval(() => {
    if (isConnected) {
        const total = cacheMetrics.hits + cacheMetrics.misses;
        if (total > 0) {
            const rate = ((cacheMetrics.hits / total) * 100).toFixed(2);
            logger.info(`[REDIS_METRICS] Hit Rate: ${rate}% | Hits: ${cacheMetrics.hits} | Misses: ${cacheMetrics.misses}`);
        }
    }
}, 60000);

export default client;
