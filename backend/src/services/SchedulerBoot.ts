import logger from '../utils/logger';
import redis from '../config/redis';
import { startSchedulerQueueEngine, stopSchedulerQueueEngine } from './SchedulerQueueEngine';
import { randomUUID } from 'crypto';

const SCHEDULER_LOCK_KEY = 'global:esparex:scheduler:lock';
const SCHEDULER_LOCK_TTL_SECONDS = 60;
const SCHEDULER_LOCK_RENEW_INTERVAL_MS = 30000;
const RENEW_LOCK_SCRIPT = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("EXPIRE", KEYS[1], ARGV[2]) else return 0 end';
const RELEASE_LOCK_SCRIPT = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end';
let schedulerLockInterval: NodeJS.Timeout | null = null;
let holdsSchedulerLock = false;
let schedulerLockToken: string | null = null;

export const startScheduler = async () => {
    try {
        schedulerLockToken = `${process.pid}:${randomUUID()}`;
        const acquired = await redis.set(SCHEDULER_LOCK_KEY, schedulerLockToken, 'EX', SCHEDULER_LOCK_TTL_SECONDS, 'NX');

        if (acquired !== 'OK') {
            logger.warn('Scheduler lock already exists in Redis. Another scheduler instance is already running.');
            logger.warn('Will retry acquiring the lock in the background...');
            setTimeout(() => void startScheduler().catch((err: unknown) => logger.error('Retry failed', { error: err instanceof Error ? err.message : String(err) })), 15000);
            return;
        }

        holdsSchedulerLock = true;
        logger.info('Acquired global scheduler lock natively.');

        // Keep the lock alive via heartbeat
        schedulerLockInterval = setInterval(() => {
            if (!holdsSchedulerLock || !schedulerLockToken) return;
            redis
                .eval(
                    RENEW_LOCK_SCRIPT,
                    1,
                    SCHEDULER_LOCK_KEY,
                    schedulerLockToken,
                    String(SCHEDULER_LOCK_TTL_SECONDS)
                )
                .then(async (result) => {
                    if (Number(result) !== 1) {
                        holdsSchedulerLock = false;
                        logger.error('Scheduler lock ownership lost. Stopping scheduler to prevent duplicate execution.');
                        await stopSchedulerQueueEngine().catch((err) => {
                            logger.error('Failed to stop scheduler queue engine after lock loss', {
                                error: err instanceof Error ? err.message : String(err)
                            });
                        });
                        process.exit(1);
                    }
                })
                .catch((err: unknown) => {
                    logger.error('Failed to renew scheduler lock timestamp', { error: err instanceof Error ? err.message : String(err) });
                });
        }, SCHEDULER_LOCK_RENEW_INTERVAL_MS);
        schedulerLockInterval.unref();

        await startSchedulerQueueEngine();
        logger.info('Scheduler Queue Engine successfully started strictly in background.');
    } catch (error) {
        logger.error('Failed to start scheduler or acquire lock', {
            error: error instanceof Error ? error.message : String(error)
        });
        process.exit(1);
    }
};

export const stopScheduler = async () => {
    if (schedulerLockInterval) {
        clearInterval(schedulerLockInterval);
        schedulerLockInterval = null;
    }

    try {
        await stopSchedulerQueueEngine();
    } catch (error) {
        logger.error('Error stopping scheduler queue engine', {
            error: error instanceof Error ? error.message : String(error)
        });
    }

    if (holdsSchedulerLock && schedulerLockToken) {
        try {
            await redis.eval(RELEASE_LOCK_SCRIPT, 1, SCHEDULER_LOCK_KEY, schedulerLockToken);
            holdsSchedulerLock = false;
            schedulerLockToken = null;
            logger.info('Released global scheduler lock during shutdown.');
        } catch (error) {
            logger.error('Error releasing scheduler lock', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
};
