import type { JobsOptions } from 'bullmq';

export const QUEUE_DEFAULT_ATTEMPTS = 5;
export const QUEUE_DEFAULT_BACKOFF_DELAY_MS = 2_000;

const BASE_BACKOFF = {
    type: 'exponential' as const,
    delay: QUEUE_DEFAULT_BACKOFF_DELAY_MS,
};

const BASE_DEFAULT_JOB_OPTIONS: JobsOptions = {
    attempts: QUEUE_DEFAULT_ATTEMPTS,
    backoff: BASE_BACKOFF,
    removeOnComplete: 200,
    removeOnFail: 500,
};

export const withQueueDefaults = (overrides: JobsOptions = {}): JobsOptions => ({
    ...BASE_DEFAULT_JOB_OPTIONS,
    ...overrides,
    backoff: typeof overrides.backoff === 'object' && overrides.backoff
        ? { ...BASE_BACKOFF, ...overrides.backoff }
        : BASE_BACKOFF,
});

export const queueWorkerBackoffStrategy = (
    attemptsMade: number,
    baseDelayMs = QUEUE_DEFAULT_BACKOFF_DELAY_MS,
    maxDelayMs = 60_000
): number => Math.min(baseDelayMs * Math.pow(2, Math.max(0, attemptsMade - 1)), maxDelayMs);
