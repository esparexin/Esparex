"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldDisableRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const env_1 = require("./env");
const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
const shouldDisableRedis = (env_1.env.NODE_ENV === 'test' || isJestRuntime) && !env_1.env.ALLOW_REDIS;
exports.shouldDisableRedis = shouldDisableRedis;
const redisHost = env_1.env.REDIS_HOST;
const redisPort = env_1.env.REDIS_PORT;
const redisPassword = env_1.env.REDIS_PASSWORD;
const redisDb = env_1.env.REDIS_DB;
const redisUrl = env_1.env.REDIS_URL || (() => {
    const auth = redisPassword ? `:${encodeURIComponent(redisPassword)}@` : '';
    return `redis://${auth}${redisHost}:${redisPort}/${redisDb}`;
})();
// 🔍 STARTUP AUDIT: Log the connection protocol and host (obfuscated)
const auditUrl = (redisUrl || '').replace(/:[^:@]+@/, ':****@');
if (!shouldDisableRedis) {
    console.error(`[EMERGENCY_REDIS_AUDIT] Prot: ${(redisUrl || '').split(':')[0]} | URL: ${auditUrl}`);
    logger_1.default.warn(`[REDIS_BOOT] Protocol: ${(redisUrl || '').split(':')[0]} | URL: ${auditUrl}`);
}
if (env_1.env.NODE_ENV === 'production') {
    if (!redisPassword && !redisUrl.includes(':@') && !redisUrl.includes('//:')) {
        logger_1.default.warn('⚠️ Redis connection lacks a password. Ensure REDIS_PASSWORD is set in production.');
    }
    if (!redisUrl.startsWith('rediss://')) {
        logger_1.default.warn('⚠️ Redis connection is not using TLS (rediss://). Cloud-hosted Redis should be encrypted.');
    }
}
const redis = shouldDisableRedis
    ? {
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
    }
    : new ioredis_1.default(redisUrl, {
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
        logger_1.default.info('Redis connected', {
            host: redisHost,
            port: redisPort,
            db: redisDb,
        });
    });
    redis.on('error', (err) => {
        logger_1.default.error('Redis connection error', { error: err.message });
    });
}
exports.default = redis;
//# sourceMappingURL=redis.js.map