export type UniversalContextStorage<T> = {
    getStore: () => T | undefined;
    enterWith: (value: T) => void;
};

export function createUniversalAsyncLocalStorage<T>(fallbackValue?: T): UniversalContextStorage<T> {
    let fallbackStore: T | undefined = fallbackValue;
    const fallbackStorage: UniversalContextStorage<T> = {
        getStore: () => fallbackStore,
        enterWith: (value: T) => {
            fallbackStore = value;
        },
    };

    const runtime = globalThis as { window?: unknown };
    if (typeof runtime.window !== 'undefined') {
        return fallbackStorage;
    }

    try {
        const dynamicRequire = Function("return typeof require === 'function' ? require : null")() as
            | ((moduleName: string) => unknown)
            | null;
        if (!dynamicRequire) return fallbackStorage;

        const asyncHooks = dynamicRequire('node:async_hooks') as {
            AsyncLocalStorage?: new () => {
                getStore: () => unknown;
                enterWith: (value: unknown) => void;
            };
        };
        const AsyncLocalStorageCtor = asyncHooks?.AsyncLocalStorage;
        if (typeof AsyncLocalStorageCtor !== 'function') {
            return fallbackStorage;
        }

        const storage = new AsyncLocalStorageCtor();
        return {
            getStore: () => {
                const current = storage.getStore();
                return current !== null && current !== undefined ? (current as T) : undefined;
            },
            enterWith: (value: T) => storage.enterWith(value),
        };
    } catch {
        return fallbackStorage;
    }
}

const storage = createUniversalAsyncLocalStorage<string>('');

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
