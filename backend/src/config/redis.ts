import Redis from 'ioredis';
import logger from '../utils/logger';

const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
const shouldDisableRedis =
    (process.env.NODE_ENV === 'test' || isJestRuntime) && process.env.ALLOW_REDIS !== 'true';
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD;
const redisDb = Number(process.env.REDIS_DB || '0');
const redisUrl = process.env.REDIS_URL || (() => {
    const auth = redisPassword ? `:${encodeURIComponent(redisPassword)}@` : '';
    return `redis://${auth}${redisHost}:${redisPort}/${redisDb}`;
})();

// 🔍 STARTUP AUDIT: Log the connection protocol and host (obfuscated)
const auditUrl = (redisUrl || '').replace(/:[^:@]+@/, ':****@');
if (!shouldDisableRedis) {
    console.error(`[EMERGENCY_REDIS_AUDIT] Prot: ${(redisUrl || '').split(':')[0]} | URL: ${auditUrl}`);
    logger.warn(`[REDIS_BOOT] Protocol: ${(redisUrl || '').split(':')[0]} | URL: ${auditUrl}`);
}

if (process.env.NODE_ENV === 'production') {
    if (!redisPassword && !redisUrl.includes(':@') && !redisUrl.includes('//:')) {
        logger.warn('⚠️ Redis connection lacks a password. Ensure REDIS_PASSWORD is set in production.');
    }
    if (!redisUrl.startsWith('rediss://')) {
        logger.warn('⚠️ Redis connection is not using TLS (rediss://). Cloud-hosted Redis should be encrypted.');
    }
}

const redis: Redis = shouldDisableRedis
    ? ({
        call: async () => null,
        get: async () => null,
        set: async () => 'OK',
        setex: async () => 'OK',
        del: async () => 0,
        exists: async () => 0,
        keys: async () => [],
        scan: async () => ['0', []],
        ttl: async () => -2,
        ping: async () => 'PONG',
        incr: async () => 0,
        expire: async () => 0,
        eval: async () => 0,
        dbsize: async () => 0,
        info: async () => '',
        quit: async () => 'OK',
        disconnect: () => undefined,
        status: 'end',
        on: () => undefined,
    } as unknown as Redis)
    : new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: true,
        enableReadyCheck: false,
        connectTimeout: 10000,
        tls: undefined,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    });

if (!shouldDisableRedis) {
    redis.on('connect', () => {
        logger.info('Redis connected', {
            host: redisHost,
            port: redisPort,
            db: redisDb,
        });
    });

    redis.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
    });
}

export { shouldDisableRedis };
export default redis;
