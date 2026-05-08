import type { ConnectionOptions as BullMqConnectionOptions } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import { env } from './env';
import {
    isLocalRedisHost,
    resolveRedisConfig,
    type RedisConfigSource,
} from './redisConfig';

export interface CanonicalRedisRuntimeConfig {
    source: RedisConfigSource;
    host: string;
    port: number;
    db: number;
    username?: string;
    password?: string;
    tlsEnabled: boolean;
    redisUrl: string;
    sanitizedRedisUrl: string;
}

const resolveRedisRuntimeConfig = (): CanonicalRedisRuntimeConfig => {
    return resolveRedisConfig({
        REDIS_URL: env.REDIS_URL,
        REDIS_HOST: env.REDIS_HOST,
        REDIS_PORT: env.REDIS_PORT,
        REDIS_DB: env.REDIS_DB,
        REDIS_USERNAME: env.REDIS_USERNAME,
        REDIS_PASSWORD: env.REDIS_PASSWORD,
    });
};

const assertProductionRedisRuntimeSafety = (config: CanonicalRedisRuntimeConfig): void => {
    if (env.NODE_ENV !== 'production') return;

    if (isLocalRedisHost(config.host)) {
        throw new Error(
            `Invalid production Redis configuration: host "${config.host}" is local-only and blocked.`
        );
    }

    if (!config.username) {
        throw new Error(
            'Invalid production Redis configuration: ACL username is required. Set REDIS_USERNAME or include username in REDIS_URL.'
        );
    }

    if (!config.password) {
        throw new Error(
            'Invalid production Redis configuration: ACL password is required. Set REDIS_PASSWORD or include password in REDIS_URL.'
        );
    }
};

const redisRuntimeConfig = resolveRedisRuntimeConfig();
assertProductionRedisRuntimeSafety(redisRuntimeConfig);

export const getRedisRuntimeConfig = (): CanonicalRedisRuntimeConfig => ({
    ...redisRuntimeConfig,
});

export const getRedisConnectionOptions = (): RedisOptions => ({
    host: redisRuntimeConfig.host,
    port: redisRuntimeConfig.port,
    db: redisRuntimeConfig.db,
    ...(redisRuntimeConfig.username ? { username: redisRuntimeConfig.username } : {}),
    ...(redisRuntimeConfig.password ? { password: redisRuntimeConfig.password } : {}),
    tls: redisRuntimeConfig.tlsEnabled ? {} : undefined,
});

export const getBullMqConnectionOptions = (): BullMqConnectionOptions => ({
    ...getRedisConnectionOptions(),
});
