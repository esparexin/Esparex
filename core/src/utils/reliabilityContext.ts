type ReliabilityContext = {
    traceId?: string;
    userId?: string;
    requestPath?: string;
    method?: string;
    jobId?: string;
    jobName?: string;
    queueName?: string;
};

type ContextStorage = {
    getStore: () => ReliabilityContext | undefined;
    enterWith: (value: ReliabilityContext) => void;
};

const createFallbackStorage = (): ContextStorage => {
    let current: ReliabilityContext = {};
    return {
        getStore: () => current,
        enterWith: (value: ReliabilityContext) => {
            current = value;
        }
    };
};

const createContextStorage = (): ContextStorage => {
    const runtime = globalThis as { window?: unknown };
    if (typeof runtime.window !== 'undefined') {
        return createFallbackStorage();
    }

    try {
        const dynamicRequire = Function("return typeof require === 'function' ? require : null")() as
            | ((moduleName: string) => unknown)
            | null;
        if (!dynamicRequire) return createFallbackStorage();

        const asyncHooks = dynamicRequire('node:async_hooks') as {
            AsyncLocalStorage?: new () => {
                getStore: () => unknown;
                enterWith: (value: unknown) => void;
            };
        };
        const AsyncLocalStorageCtor = asyncHooks?.AsyncLocalStorage;
        if (typeof AsyncLocalStorageCtor !== 'function') {
            return createFallbackStorage();
        }

        const storage = new AsyncLocalStorageCtor();
        return {
            getStore: () => {
                const context = storage.getStore();
                return typeof context === 'object' && context !== null
                    ? context as ReliabilityContext
                    : undefined;
            },
            enterWith: (value: ReliabilityContext) => storage.enterWith(value),
        };
    } catch {
        return createFallbackStorage();
    }
};

const storage = createContextStorage();

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

