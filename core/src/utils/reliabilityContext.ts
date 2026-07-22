import { createUniversalAsyncLocalStorage } from '@esparex/shared';

type ReliabilityContext = {
    traceId?: string;
    userId?: string;
    requestPath?: string;
    method?: string;
    jobId?: string;
    jobName?: string;
    queueName?: string;
};

const storage = createUniversalAsyncLocalStorage<ReliabilityContext>({});

const trimString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
};

export const setReliabilityContext = (partial: Partial<ReliabilityContext>): void => {
    const current = storage.getStore() || {};
    storage.enterWith({
        ...current,
        ...(partial.traceId !== undefined ? { traceId: trimString(partial.traceId) } : {}),
        ...(partial.userId !== undefined ? { userId: trimString(partial.userId) } : {}),
        ...(partial.requestPath !== undefined ? { requestPath: trimString(partial.requestPath) } : {}),
        ...(partial.method !== undefined ? { method: trimString(partial.method) } : {}),
        ...(partial.jobId !== undefined ? { jobId: trimString(partial.jobId) } : {}),
        ...(partial.jobName !== undefined ? { jobName: trimString(partial.jobName) } : {}),
        ...(partial.queueName !== undefined ? { queueName: trimString(partial.queueName) } : {}),
    });
};

export const clearReliabilityContext = (): void => {
    storage.enterWith({});
};

export const getReliabilityContextSnapshot = (): ReliabilityContext => {
    return storage.getStore() || {};
};

