import { Redis } from 'ioredis';
import { env } from '../config/env';
import { getRedisConnectionOptions } from '../config/redisRuntime';

const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';

export const shouldDisableQueueConnection =
    (env.NODE_ENV === 'test' || isJestRuntime) &&
    !env.ALLOW_SCHEDULER_QUEUE;

export const redisConnection = shouldDisableQueueConnection
    ? ({} as Redis)
    : new Redis(getRedisConnectionOptions());

export const isQueueConnectionAvailable = (): boolean => {
    if (shouldDisableQueueConnection) return false;

    const status = (redisConnection as unknown as { status?: string }).status;

    return status === 'ready' || status === 'connect';
};