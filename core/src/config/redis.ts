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

const REDIS_CONNECT_TIMEOUT_MS = 10_000;
const REDIS_COMMAND_TIMEOUT_MS = 8_000;
const REDIS_MAX_RETRY_DELAY_MS = 30_000;
const REDIS_INITIAL_RETRY_DELAY_MS = 250;
const REDIS_RETRY_LOG_INTERVAL = 5;
const REDIS_READY_TIMEOUT_MS = env.RELIABILITY_STARTUP_READINESS_TIMEOUT_MS ?? 12_000;

const getRetryDelay = (attempt: number): number =>
    Math.min(
        REDIS_INITIAL_RETRY_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1)),
        REDIS_MAX_RETRY_DELAY_MS
    );

const sanitizeRedisUrl = (value: string): string => value.replace(/:[^:@]+@/, ':****@');

const validateRedisUrl = (urlValue: string): void => {
    const parsed = new URL(urlValue);
    if (!['redis:', 'rediss:'].includes(parsed.protocol)) {
        throw new Error(`Invalid REDIS_URL protocol: ${parsed.protocol}`);
    }
};

if (!shouldDisableRedis) {
    validateRedisUrl(redisUrl);
}

// 🔍 STARTUP AUDIT: Log the connection protocol and host (obfuscated)
const auditUrl = sanitizeRedisUrl(redisUrl || '');
if (!shouldDisableRedis) {
    logger.info('[REDIS_BOOT] Redis runtime configuration loaded', {
        protocol: (redisUrl || '').split(':')[0],
        url: auditUrl
    });
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
        mget: (...keys: string[]) => Promise.resolve(keys.map(() => null)),
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
        pipeline: () => {
            const chain = {
                set: () => chain,
                exec: async () => ([]),
            };
            return chain;
        },
        quit: () => Promise.resolve('OK'),
        disconnect: () => undefined,
        status: 'end',
        on: () => undefined,
    } as unknown as Redis)
    : new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        enableReadyCheck: true,
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
        commandTimeout: REDIS_COMMAND_TIMEOUT_MS,
        lazyConnect: false,
        keepAlive: 10000,
        maxLoadingRetryTime: REDIS_MAX_RETRY_DELAY_MS,
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
        retryStrategy(times) {
            const delay = getRetryDelay(times);
            if (times === 1 || times % REDIS_RETRY_LOG_INTERVAL === 0) {
                logger.warn('[REDIS_RETRY] Reconnecting to Redis', {
                    attempt: times,
                    delayMs: delay
                });
            }
            return delay;
        },
        reconnectOnError(err) {
            const code = (err as NodeJS.ErrnoException).code;
            if (code === 'EPERM' || code === 'EACCES') {
                logger.error('[REDIS_RECONNECT] Permission error from Redis socket', {
                    code,
                    message: err.message,
                });
                return true;
            }
            if (code === 'ETIMEDOUT' || code === 'ECONNRESET') {
                logger.warn('[REDIS_RECONNECT] Transient Redis network failure', {
                    code,
                    message: err.message
                });
                return true;
            }
            return false;
        }
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
        logger.error('Redis connection error', {
            code: (err as NodeJS.ErrnoException).code,
            error: err.message
        });
    });

    redis.on('close', () => {
        logger.warn('Redis connection closed');
    });

    redis.on('ready', () => {
        logger.info('Redis client ready');
    });
}

const getRedisStatus = (): string => (redis as unknown as { status?: string }).status ?? 'unknown';

export const waitForRedisReady = async (
    options: {
        timeoutMs?: number;
        context?: string;
    } = {}
): Promise<void> => {
    if (shouldDisableRedis) {
        return;
    }

    const timeoutMs = options.timeoutMs ?? REDIS_READY_TIMEOUT_MS;
    const context = options.context ?? 'runtime-startup';
    const initialStatus = getRedisStatus();
    if (initialStatus === 'ready') {
        return;
    }

    logger.info('[REDIS_BOOT] Waiting for ready state before Redis-backed startup', {
        context,
        status: initialStatus,
        timeoutMs,
    });

    let lastErrorMessage: string | null = null;
    await new Promise<void>((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            cleanup();
            const status = getRedisStatus();
            const reason = lastErrorMessage ? `; lastError=${lastErrorMessage}` : '';
            reject(new Error(`Redis not ready within ${timeoutMs}ms (status=${status}, context=${context})${reason}`));
        }, timeoutMs);
        timer.unref?.();

        const onReady = () => {
            cleanup();
            resolve();
        };

        const onError = (err: unknown) => {
            if (err instanceof Error) {
                lastErrorMessage = err.message;
            } else {
                lastErrorMessage = String(err);
            }
        };

        const onEnd = () => {
            cleanup();
            const reason = lastErrorMessage ? `; lastError=${lastErrorMessage}` : '';
            reject(new Error(`Redis connection ended before ready state (context=${context})${reason}`));
        };

        const cleanup = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            redis.off('ready', onReady);
            redis.off('error', onError);
            redis.off('end', onEnd);
        };

        redis.on('ready', onReady);
        redis.on('error', onError);
        redis.on('end', onEnd);

        if (getRedisStatus() === 'ready') {
            onReady();
        }
    });

    logger.info('[REDIS_BOOT] Ready state confirmed for Redis-backed startup', {
        context,
    });
};

export { shouldDisableRedis };
export default redis;
