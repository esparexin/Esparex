"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopScheduler = exports.startScheduler = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const redis_1 = __importDefault(require("@core/config/redis"));
const SchedulerQueueEngine_1 = require("./SchedulerQueueEngine");
const crypto_1 = require("crypto");
const SCHEDULER_LOCK_KEY = 'global:esparex:scheduler:lock';
const SCHEDULER_LOCK_TTL_SECONDS = 60;
const SCHEDULER_LOCK_RENEW_INTERVAL_MS = 30000;
const RENEW_LOCK_SCRIPT = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("EXPIRE", KEYS[1], ARGV[2]) else return 0 end';
const RELEASE_LOCK_SCRIPT = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end';
let schedulerLockInterval = null;
let holdsSchedulerLock = false;
let schedulerLockToken = null;
const startScheduler = async () => {
    try {
        schedulerLockToken = `${process.pid}:${(0, crypto_1.randomUUID)()}`;
        const acquired = await redis_1.default.set(SCHEDULER_LOCK_KEY, schedulerLockToken, 'EX', SCHEDULER_LOCK_TTL_SECONDS, 'NX');
        if (acquired !== 'OK') {
            logger_1.default.warn('Scheduler lock already exists in Redis. Another scheduler instance is already running.');
            logger_1.default.warn('Will retry acquiring the lock in the background...');
            setTimeout(() => void (0, exports.startScheduler)().catch((err) => logger_1.default.error('Retry failed', { error: err instanceof Error ? err.message : String(err) })), 15000);
            return;
        }
        holdsSchedulerLock = true;
        logger_1.default.info('Acquired global scheduler lock natively.');
        // Keep the lock alive via heartbeat
        schedulerLockInterval = setInterval(() => {
            if (!holdsSchedulerLock || !schedulerLockToken)
                return;
            redis_1.default
                .eval(RENEW_LOCK_SCRIPT, 1, SCHEDULER_LOCK_KEY, schedulerLockToken, String(SCHEDULER_LOCK_TTL_SECONDS))
                .then(async (result) => {
                if (Number(result) !== 1) {
                    holdsSchedulerLock = false;
                    logger_1.default.error('Scheduler lock ownership lost. Stopping scheduler to prevent duplicate execution.');
                    await (0, SchedulerQueueEngine_1.stopSchedulerQueueEngine)().catch((err) => {
                        logger_1.default.error('Failed to stop scheduler queue engine after lock loss', {
                            error: err instanceof Error ? err.message : String(err)
                        });
                    });
                    process.exit(1);
                }
            })
                .catch((err) => {
                logger_1.default.error('Failed to renew scheduler lock timestamp', { error: err instanceof Error ? err.message : String(err) });
            });
        }, SCHEDULER_LOCK_RENEW_INTERVAL_MS);
        schedulerLockInterval.unref();
        await (0, SchedulerQueueEngine_1.startSchedulerQueueEngine)();
        logger_1.default.info('Scheduler Queue Engine successfully started strictly in background.');
    }
    catch (error) {
        logger_1.default.error('Failed to start scheduler or acquire lock', {
            error: error instanceof Error ? error.message : String(error)
        });
        process.exit(1);
    }
};
exports.startScheduler = startScheduler;
const stopScheduler = async () => {
    if (schedulerLockInterval) {
        clearInterval(schedulerLockInterval);
        schedulerLockInterval = null;
    }
    try {
        await (0, SchedulerQueueEngine_1.stopSchedulerQueueEngine)();
    }
    catch (error) {
        logger_1.default.error('Error stopping scheduler queue engine', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
    if (holdsSchedulerLock && schedulerLockToken) {
        try {
            await redis_1.default.eval(RELEASE_LOCK_SCRIPT, 1, SCHEDULER_LOCK_KEY, schedulerLockToken);
            holdsSchedulerLock = false;
            schedulerLockToken = null;
            logger_1.default.info('Released global scheduler lock during shutdown.');
        }
        catch (error) {
            logger_1.default.error('Error releasing scheduler lock', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
};
exports.stopScheduler = stopScheduler;
//# sourceMappingURL=SchedulerBoot.js.map