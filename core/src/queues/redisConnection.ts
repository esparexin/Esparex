import { env } from '../config/env';
import { redisFactory, shouldDisableRedis } from '../infrastructure/redis/redisFactory';
import type { Redis } from 'ioredis';

const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';

export const shouldDisableQueueConnection =
    shouldDisableRedis ||
    ((env.NODE_ENV === 'test' || isJestRuntime) &&
    !env.ALLOW_SCHEDULER_QUEUE);

export const redisConnection = shouldDisableQueueConnection
    ? ({} as Redis)
    : redisFactory.bull();

export const isQueueConnectionAvailable = (): boolean => {
    if (shouldDisableQueueConnection) return false;

    const status = (redisConnection as unknown as { status?: string }).status;

    return status === 'ready' || status === 'connect';
};
