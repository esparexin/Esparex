import { Redis } from "ioredis";
import bootstrapLogger from "../utils/bootstrapLogger";
import { env } from "../config/env";

const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
export const shouldDisableQueueConnection =
    (env.NODE_ENV === 'test' || isJestRuntime) && !env.ALLOW_SCHEDULER_QUEUE;

const REDIS_URL = env.REDIS_URL || 'redis://127.0.0.1:6379';
const QUEUE_REDIS_CONNECT_TIMEOUT_MS = 10_000;
const QUEUE_REDIS_MAX_RETRY_DELAY_MS = 30_000;
const QUEUE_REDIS_INITIAL_RETRY_DELAY_MS = 250;

if (env.NODE_ENV === 'production') {
    if (!REDIS_URL.includes('@') && !env.REDIS_PASSWORD) {
        bootstrapLogger.warn('Queue Redis connection lacks a password in production environment.');
    }
    if (!REDIS_URL.startsWith('rediss://')) {
        bootstrapLogger.warn('Queue Redis connection is not using TLS (rediss://). Cloud-hosted Redis should be encrypted.');
    }
}

if (!shouldDisableQueueConnection) {
    const parsed = new URL(REDIS_URL);
    if (!['redis:', 'rediss:'].includes(parsed.protocol)) {
        throw new Error(`Invalid REDIS_URL protocol for queue runtime: ${parsed.protocol}`);
    }
}

const queueRetryDelay = (attempt: number): number =>
    Math.min(
        QUEUE_REDIS_INITIAL_RETRY_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1)),
        QUEUE_REDIS_MAX_RETRY_DELAY_MS
    );

// We use maxRetriesPerRequest: null, which is required by BullMQ
export const redisConnection = shouldDisableQueueConnection
    ? ({} as Redis)
    : new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        connectTimeout: QUEUE_REDIS_CONNECT_TIMEOUT_MS,
        keepAlive: 10000,
        lazyConnect: false,
        tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
        retryStrategy(times) {
            const delay = queueRetryDelay(times);
            if (times === 1 || times % 5 === 0) {
                bootstrapLogger.warn('[QUEUE_REDIS_RETRY] reconnecting', { attempt: times, delayMs: delay });
            }
            return delay;
        },
        reconnectOnError(err) {
            const code = (err as NodeJS.ErrnoException).code;
            if (code === 'EPERM' || code === 'EACCES' || code === 'ECONNRESET' || code === 'ETIMEDOUT') {
                bootstrapLogger.error('[QUEUE_REDIS_RECONNECT] transient/permission error', {
                    code,
                    message: err.message
                });
                return true;
            }
            return false;
        }
    });

export const isQueueConnectionAvailable = (): boolean => {
    if (shouldDisableQueueConnection) return false;
    const status = (redisConnection as unknown as { status?: string }).status;
    return status === 'ready' || status === 'connect';
};
