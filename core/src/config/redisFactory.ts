import redisClient, {
    closeRedisClients,
    getRedisClientByRole,
    getRedisOperationalObservabilityReport,
    shouldDisableRedis,
    waitForRedisReady,
    type RedisClientRole,
} from './redis';

export const redisFactory = {
    app: () => getRedisClientByRole('app'),
    pub: () => getRedisClientByRole('pub'),
    sub: () => getRedisClientByRole('sub'),
    bull: () => getRedisClientByRole('bull'),
    worker: () => getRedisClientByRole('worker'),
    health: () => getRedisClientByRole('health'),
};

export {
    closeRedisClients,
    getRedisClientByRole,
    getRedisOperationalObservabilityReport,
    shouldDisableRedis,
    waitForRedisReady,
};

export type { RedisClientRole };
export default redisClient;
