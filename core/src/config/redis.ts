import Redis, { type RedisOptions } from 'ioredis';
import logger from '../utils/logger';
import { env } from './env';
import {
    getRedisConnectionOptions,
    getRedisRuntimeConfig,
} from './redisRuntime';

const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
const shouldDisableRedis =
    (env.NODE_ENV === 'test' || isJestRuntime || !env.ALLOW_REDIS);

const redisRuntime = getRedisRuntimeConfig();
const redisConnectionOptions = getRedisConnectionOptions();

const redisHost = redisRuntime.host;
const redisPort = redisRuntime.port;
const redisDb = redisRuntime.db;
const redisPassword = redisRuntime.password;
const redisUrl = redisRuntime.redisUrl;

const REDIS_CONNECT_TIMEOUT_MS = env.NODE_ENV === 'production' ? 10_000 : 2_000;
const REDIS_COMMAND_TIMEOUT_MS = env.NODE_ENV === 'production' ? 8_000 : 2_000;
const REDIS_MAX_RETRY_DELAY_MS = 30_000;
const REDIS_INITIAL_RETRY_DELAY_MS = 250;
const REDIS_RETRY_LOG_INTERVAL = 5;
const REDIS_READY_TIMEOUT_MS = env.RELIABILITY_STARTUP_READINESS_TIMEOUT_MS ?? 12_000;

type RedisClientRole = 'app' | 'pub' | 'sub' | 'bull' | 'worker' | 'health';

const roleClientRegistry = new Map<RedisClientRole, Redis>();
const roleReconnectCounts = new Map<RedisClientRole, number>();
const roleLastReadyAt = new Map<RedisClientRole, string | null>();
const roleLastError = new Map<RedisClientRole, string | null>();

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

const baseRoleOptions = (role: RedisClientRole): RedisOptions => ({
    ...redisConnectionOptions,
    maxRetriesPerRequest: role === 'app' && env.NODE_ENV !== 'production' ? 0 : null,
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
                role,
                attempt: times,
                delayMs: delay
            });
        }
        roleReconnectCounts.set(role, (roleReconnectCounts.get(role) || 0) + 1);
        return delay;
    },
    reconnectOnError(err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'EPERM' || code === 'EACCES') {
            logger.error('[REDIS_RECONNECT] Permission error from Redis socket', {
                role,
                code,
                message: err.message,
            });
            return true;
        }
        if (code === 'ETIMEDOUT' || code === 'ECONNRESET') {
            logger.warn('[REDIS_RECONNECT] Transient Redis network failure', {
                role,
                code,
                message: err.message
            });
            return true;
        }
        return false;
    }
});

const attachRoleTelemetry = (role: RedisClientRole, client: Redis): Redis => {
    roleLastReadyAt.set(role, null);
    roleLastError.set(role, null);

    client.on('connect', () => {
        logger.info('Redis connected', {
            role,
            host: redisHost,
            port: redisPort,
            db: redisDb,
        });
    });

    client.on('error', (err) => {
        const message = err.message;
        roleLastError.set(role, message);
        logger.error('Redis connection error', {
            role,
            code: (err as NodeJS.ErrnoException).code,
            error: message
        });
    });

    client.on('close', () => {
        logger.warn('Redis connection closed', { role });
    });

    client.on('ready', () => {
        const now = new Date().toISOString();
        roleLastReadyAt.set(role, now);
        roleLastError.set(role, null);
        logger.info('Redis client ready', { role });
    });

    return client;
};

const createNoopRedisClient = (): Redis => ({
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
    off: () => undefined,
} as unknown as Redis);

const createRedisClient = (role: RedisClientRole): Redis => {
    if (shouldDisableRedis) return createNoopRedisClient();
    return attachRoleTelemetry(role, new Redis(baseRoleOptions(role)));
};

const getOrCreateRoleClient = (role: RedisClientRole): Redis => {
    const existing = roleClientRegistry.get(role);
    if (existing) return existing;
    const created = createRedisClient(role);
    roleClientRegistry.set(role, created);
    return created;
};

if (!shouldDisableRedis) {
    validateRedisUrl(redisUrl);
}

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

const redis = getOrCreateRoleClient('app');

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
    try {
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
    } catch (error) {
        const isProduction = env.NODE_ENV === 'production';
        const redisRequired = isProduction;
        if (redisRequired) {
            throw error;
        }
        logger.warn('Redis unavailable during API bootstrap; continuing with in-memory cache and rate limiter fallbacks.', {
            context,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const getRedisClientByRole = (role: RedisClientRole): Redis => getOrCreateRoleClient(role);

export const getRedisOperationalObservabilityReport = (): {
    redisConnected: boolean;
    cacheBackend: 'redis' | 'in-memory-fallback';
    queueBackend: 'redis' | 'in-memory-fallback';
    pubSubBackend: 'redis' | 'in-memory-fallback';
    reconnects: Record<RedisClientRole, number>;
    fallbackState: 'active' | 'inactive';
    runtimeWarnings: string[];
    timestamp: string;
} => {
    const appStatus = (getOrCreateRoleClient('app') as unknown as { status?: string }).status;
    const queueStatus = (getOrCreateRoleClient('bull') as unknown as { status?: string }).status;
    const subStatus = (getOrCreateRoleClient('sub') as unknown as { status?: string }).status;
    const isReady = (status?: string): boolean => status === 'ready' || status === 'connect';
    const runtimeWarnings: string[] = [];

    if (shouldDisableRedis) {
        runtimeWarnings.push('redis_disabled_by_runtime_flags');
    }
    if (!isReady(appStatus)) runtimeWarnings.push('app_redis_not_ready');
    if (!isReady(queueStatus)) runtimeWarnings.push('queue_redis_not_ready');
    if (!isReady(subStatus)) runtimeWarnings.push('pubsub_redis_not_ready');

    return {
        redisConnected: isReady(appStatus),
        cacheBackend: shouldDisableRedis ? 'in-memory-fallback' : 'redis',
        queueBackend: shouldDisableRedis ? 'in-memory-fallback' : 'redis',
        pubSubBackend: shouldDisableRedis ? 'in-memory-fallback' : 'redis',
        reconnects: {
            app: roleReconnectCounts.get('app') || 0,
            pub: roleReconnectCounts.get('pub') || 0,
            sub: roleReconnectCounts.get('sub') || 0,
            bull: roleReconnectCounts.get('bull') || 0,
            worker: roleReconnectCounts.get('worker') || 0,
            health: roleReconnectCounts.get('health') || 0,
        },
        fallbackState: shouldDisableRedis ? 'active' : 'inactive',
        runtimeWarnings,
        timestamp: new Date().toISOString(),
    };
};

export const closeRedisClients = async (): Promise<void> => {
    const closers = Array.from(roleClientRegistry.entries()).map(async ([role, client]) => {
        try {
            await client.quit();
        } catch (error) {
            logger.warn('[REDIS_SHUTDOWN] Failed to close redis client', {
                role,
                error: error instanceof Error ? error.message : String(error),
            });
            try {
                client.disconnect();
            } catch {
                // no-op
            }
        }
    });

    await Promise.allSettled(closers);
    roleClientRegistry.clear();
};

export { shouldDisableRedis };
export type { RedisClientRole };
export default redis;
