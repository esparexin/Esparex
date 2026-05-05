type TraceStorage = {
    getStore: () => string | undefined;
    enterWith: (value: string) => void;
};

function createFallbackStorage(): TraceStorage {
    let current = '';
    return {
        getStore: () => (current.length > 0 ? current : undefined),
        enterWith: (value: string) => {
            current = value;
        },
    };
}

function createTraceStorage(): TraceStorage {
    // Browser/client bundles cannot resolve Node built-ins like async_hooks.
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
                const current = storage.getStore();
                return typeof current === 'string' ? current : undefined;
            },
            enterWith: (value: string) => storage.enterWith(value),
        };
    } catch {
        return createFallbackStorage();
    }
}

const storage = createTraceStorage();

export class TraceContext {
    static getCorrelationId(): string {
        return storage.getStore() ?? 'no-context';
    }

    /**
     * Set the correlationId for the current async context (and all its children).
     * Uses AsyncLocalStorage so concurrent requests never share state.
     */
    static setCorrelationId(id: string): void {
        storage.enterWith(id);
    }

    static clear(): void {
        storage.enterWith('');
    }
}
