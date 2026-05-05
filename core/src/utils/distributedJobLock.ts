import { randomUUID } from 'crypto';
import redisClient from '../config/redis';
import logger from './logger';

type RedisLockClient = {
    status?: string;
    set?: (...args: Array<string | number>) => Promise<string | null>;
    eval?: (...args: Array<string | number>) => Promise<number>;
    get?: (key: string) => Promise<string | null>;
    del?: (...keys: string[]) => Promise<number>;
    incr?: (key: string) => Promise<number>;
    expire?: (key: string, seconds: number) => Promise<number>;
};

type DistributedLockOptions = {
    ttlMs: number;
    lockKey?: string;
    failOpen?: boolean;
};

const READY_STATES = new Set(['ready', 'connect']);

const hasCommand = <K extends keyof RedisLockClient>(
    client: RedisLockClient,
    key: K
): client is RedisLockClient & Required<Pick<RedisLockClient, K>> =>
    typeof client[key] === 'function';

const isRedisLockCapable = (client: RedisLockClient): boolean => {
    if (!hasCommand(client, 'set')) return false;
    if (!client.status) return true;
    return READY_STATES.has(client.status);
};

const releaseLock = async (
    client: RedisLockClient,
    lockKey: string,
    token: string
) => {
    try {
        if (hasCommand(client, 'eval')) {
            await client.eval(
                'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',
                1,
                lockKey,
                token
            );
            return;
        }

        if (hasCommand(client, 'get') && hasCommand(client, 'del')) {
            const ownerToken = await client.get(lockKey);
            if (ownerToken === token) {
                await client.del(lockKey);
            }
        }
    } catch (error) {
        logger.warn('Failed to release distributed scheduler lock', {
            lockKey,
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

const recordSchedulerLockMetric = async (
    client: RedisLockClient,
    jobName: string,
    event: 'acquired' | 'skipped' | 'acquire_error' | 'release_error'
) => {
    if (!hasCommand(client, 'incr') || !hasCommand(client, 'expire')) return;

    const dayBucket = new Date().toISOString().slice(0, 10);
    const metricKey = `scheduler:metrics:lock:${jobName}:${event}:${dayBucket}`;
    try {
        await client.incr(metricKey);
        await client.expire(metricKey, 8 * 24 * 60 * 60);
    } catch (error) {
        logger.debug('Failed to write scheduler lock metric', {
            jobName,
            event,
            metricKey,
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

export const runWithDistributedJobLock = async <T>(
    jobName: string,
    options: DistributedLockOptions,
    runner: () => Promise<T>
): Promise<T | undefined> => {
    const lockKey = options.lockKey || `scheduler:lock:${jobName}`;
    const failOpen = options.failOpen !== false;
    const client = redisClient as unknown as RedisLockClient;

    if (!isRedisLockCapable(client)) {
        logger.warn('Redis lock unavailable for scheduler job', {
            jobName,
            lockKey,
            redisStatus: client.status || 'unknown',
            failOpen,
        });
        if (failOpen) {
            return runner();
        }
        return undefined;
    }

    const token = randomUUID();
    if (!hasCommand(client, 'set')) {
        logger.warn('Redis lock command unavailable for scheduler job', {
            jobName,
            lockKey,
            failOpen,
        });
        if (failOpen) {
            return runner();
        }
        return undefined;
    }

    try {
        const acquired = await client.set(lockKey, token, 'PX', options.ttlMs, 'NX');
        if (acquired !== 'OK') {
            await recordSchedulerLockMetric(client, jobName, 'skipped');
            logger.debug('Scheduler lock is already held; skipping run', {
                jobName,
                lockKey,
            });
            return undefined;
        }
        await recordSchedulerLockMetric(client, jobName, 'acquired');
    } catch (error) {
        await recordSchedulerLockMetric(client, jobName, 'acquire_error');
        logger.warn('Failed to acquire scheduler lock', {
            jobName,
            lockKey,
            error: error instanceof Error ? error.message : String(error),
            failOpen,
        });
        if (failOpen) {
            return runner();
        }
        return undefined;
    }

    try {
        return await runner();
    } finally {
        await releaseLock(client, lockKey, token);
    }
};

export default runWithDistributedJobLock;
