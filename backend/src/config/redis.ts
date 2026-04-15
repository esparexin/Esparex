import Redis from 'ioredis';
import logger from '../utils/logger';
import { env } from './env';

const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
const shouldDisableRedis =
    (env.NODE_ENV === 'test' || isJestRuntime) && !env.ALLOW_REDIS;
const redisHost = env.REDIS_HOST;
const redisPort = env.REDIS_PORT;
const redisPassword = env.REDIS_PASSWORD;
const redisDb = env.REDIS_DB;
const redisUrl = env.REDIS_URL || (() => {
    const auth = redisPassword ? `:${encodeURIComponent(redisPassword)}@` : '';
    return `redis://${auth}${redisHost}:${redisPort}/${redisDb}`;
})();

// 🔍 STARTUP AUDIT: Log the connection protocol and host (obfuscated)
const auditUrl = (redisUrl || '').replace(/:[^:@]+@/, ':****@');
if (!shouldDisableRedis) {
    console.error(`[EMERGENCY_REDIS_AUDIT] Prot: ${(redisUrl || '').split(':')[0]} | URL: ${auditUrl}`);
    logger.warn(`[REDIS_BOOT] Protocol: ${(redisUrl || '').split(':')[0]} | URL: ${auditUrl}`);
}

if (env.NODE_ENV === 'production') {
    if (!redisPassword && !redisUrl.includes(':@') && !redisUrl.includes('//:')) {
        logger.warn('⚠️ Redis connection lacks a password. Ensure REDIS_PASSWORD is set in production.');
    }
    if (!redisUrl.startsWith('rediss://')) {
        logger.warn('⚠️ Redis connection is not using TLS (rediss://). Cloud-hosted Redis should be encrypted.');
    }
}

const redis: Redis = shouldDisableRedis
    ? ({
        call: () => null,
        get: () => null,
        set: () => 'OK',
        setex: () => 'OK',
        del: () => 0,
        exists: () => 0,
        keys: () => [],
        scan: () => ['0', []],
        ttl: () => -2,
        ping: () => 'PONG',
        incr: () => 0,
        expire: () => 0,
        eval: () => 0,
        dbsize: () => 0,
        info: () => '',
        quit: () => 'OK',
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
