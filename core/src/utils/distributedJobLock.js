"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithDistributedJobLock = void 0;
const crypto_1 = require("crypto");
const redis_1 = __importDefault(require("@core/config/redis"));
const logger_1 = __importDefault(require("./logger"));
const READY_STATES = new Set(['ready', 'connect']);
const hasCommand = (client, key) => typeof client[key] === 'function';
const isRedisLockCapable = (client) => {
    if (!hasCommand(client, 'set'))
        return false;
    if (!client.status)
        return true;
    return READY_STATES.has(client.status);
};
const releaseLock = async (client, lockKey, token) => {
    try {
        if (hasCommand(client, 'eval')) {
            await client.eval('if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end', 1, lockKey, token);
            return;
        }
        if (hasCommand(client, 'get') && hasCommand(client, 'del')) {
            const ownerToken = await client.get(lockKey);
            if (ownerToken === token) {
                await client.del(lockKey);
            }
        }
    }
    catch (error) {
        logger_1.default.warn('Failed to release distributed scheduler lock', {
            lockKey,
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
const recordSchedulerLockMetric = async (client, jobName, event) => {
    if (!hasCommand(client, 'incr') || !hasCommand(client, 'expire'))
        return;
    const dayBucket = new Date().toISOString().slice(0, 10);
    const metricKey = `scheduler:metrics:lock:${jobName}:${event}:${dayBucket}`;
    try {
        await client.incr(metricKey);
        await client.expire(metricKey, 8 * 24 * 60 * 60);
    }
    catch (error) {
        logger_1.default.debug('Failed to write scheduler lock metric', {
            jobName,
            event,
            metricKey,
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
const runWithDistributedJobLock = async (jobName, options, runner) => {
    const lockKey = options.lockKey || `scheduler:lock:${jobName}`;
    const failOpen = options.failOpen !== false;
    const client = redis_1.default;
    if (!isRedisLockCapable(client)) {
        logger_1.default.warn('Redis lock unavailable for scheduler job', {
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
    const token = (0, crypto_1.randomUUID)();
    if (!hasCommand(client, 'set')) {
        logger_1.default.warn('Redis lock command unavailable for scheduler job', {
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
            logger_1.default.debug('Scheduler lock is already held; skipping run', {
                jobName,
                lockKey,
            });
            return undefined;
        }
        await recordSchedulerLockMetric(client, jobName, 'acquired');
    }
    catch (error) {
        await recordSchedulerLockMetric(client, jobName, 'acquire_error');
        logger_1.default.warn('Failed to acquire scheduler lock', {
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
    }
    finally {
        await releaseLock(client, lockKey, token);
    }
};
exports.runWithDistributedJobLock = runWithDistributedJobLock;
exports.default = exports.runWithDistributedJobLock;
//# sourceMappingURL=distributedJobLock.js.map