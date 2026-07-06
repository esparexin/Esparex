import crypto from 'crypto';
import redisClient, { shouldDisableRedis } from '../infrastructure/redis';
import logger from '../utils/logger';
import { withTimeout } from '../utils/resilience';

const IDEMPOTENCY_PREFIX = 'queue:idempotency';
const IDEMPOTENCY_TTL_SECONDS = 60 * 60;
const IDEMPOTENCY_TIMEOUT_MS = 3_000;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map((entry) => canonicalize(entry));
    if (!isPlainObject(value)) return value;
    const sortedKeys = Object.keys(value).sort();
    return sortedKeys.reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
    }, {});
};

const stableStringify = (value: unknown): string => {
    try {
        return JSON.stringify(canonicalize(value));
    } catch {
        return String(value);
    }
};

export const buildDeterministicJobId = (namespace: string, payload: unknown): string => {
    const digest = crypto
        .createHash('sha256')
        .update(`${namespace}:${stableStringify(payload)}`)
        .digest('hex');
    return `${namespace}:${digest}`;
};

const buildIdempotencyKey = (queueName: string, idempotencyKey: string): string =>
    `${IDEMPOTENCY_PREFIX}:${queueName}:${idempotencyKey}`;

export const reserveQueueIdempotencySlot = async (
    queueName: string,
    idempotencyKey: string,
    ttlSeconds = IDEMPOTENCY_TTL_SECONDS
): Promise<boolean> => {
    if (!idempotencyKey) return true;
    if (shouldDisableRedis) return true;

    const redisKey = buildIdempotencyKey(queueName, idempotencyKey);
    try {
        const result = await withTimeout(
            redisClient.set(redisKey, '1', 'EX', ttlSeconds, 'NX'),
            IDEMPOTENCY_TIMEOUT_MS,
            'Queue idempotency reservation'
        );
        return result === 'OK';
    } catch (error) {
        logger.warn('[QUEUE_IDEMPOTENCY] reservation failed-open', {
            queueName,
            idempotencyKey,
            error: error instanceof Error ? error.message : String(error),
        });
        return true;
    }
};

export const releaseQueueIdempotencySlot = async (
    queueName: string,
    idempotencyKey: string
): Promise<void> => {
    if (!idempotencyKey) return;
    if (shouldDisableRedis) return;

    const redisKey = buildIdempotencyKey(queueName, idempotencyKey);
    try {
        await redisClient.del(redisKey);
    } catch (error) {
        logger.warn('[QUEUE_IDEMPOTENCY] failed to release key', {
            queueName,
            idempotencyKey,
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
