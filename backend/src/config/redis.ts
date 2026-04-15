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
        call: () => Promise.resolve(null),
        get: () => Promise.resolve(null),
        set: () => Promise.resolve('OK'),
        setex: () => Promise.resolve('OK'),
        del: () => Promise.resolve(0),
        exists: () => Promise.resolve(0),
        keys: () => Promise.resolve([]),
        scan: () => Promise.resolve(['0', []]),
        ttl: () => Promise.resolve(-2),
        ping: () => Promise.resolve('PONG'),
        incr: () => Promise.resolve(0),
        expire: () => Promise.resolve(0),
        eval: () => Promise.resolve(0),
        dbsize: () => Promise.resolve(0),
        info: () => Promise.resolve(''),
        quit: () => Promise.resolve('OK'),
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
