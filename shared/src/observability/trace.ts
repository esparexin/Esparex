type TraceStorage = {
    getStore: () => string | undefined;
    enterWith: (value: string) => void;
};

/**
 * Fallback in-memory trace storage for environments where `AsyncLocalStorage`
 * is unavailable (browsers, exotic runtimes, failed `async_hooks` loads).
 *
 * @safety **Not concurrent-safe on Node.js.**
 * This implementation stores the correlationId in a single module-level `let`
 * variable. On Node, if `AsyncLocalStorage` fails to load, all concurrent
 * requests will share this slot — meaning one request can overwrite another's
 * correlationId. This is acceptable only in two scenarios:
 *   1. Browser / client bundles (single execution context, no concurrency).
 *   2. Single-threaded worker processes that process one job at a time.
 *
 * If you observe `correlationId` values leaking between requests on the server,
 * check whether `node:async_hooks` is available in the runtime and whether
 * `createTraceStorage` fell through to this fallback.
 */
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

    /**
     * Resets the correlationId for the current async context.
     *
     * Called by background workers (Bull/BullMQ job processors) at the end of
     * each job to ensure the next job in the same worker thread does not inherit
     * a stale correlationId from the previous one. After `clear()`, the next
     * call to `getCorrelationId()` returns the sentinel value `'no-context'`.
     *
     * @example
     * ```ts
     * // In a BullMQ worker processor:
     * processor.on('completed', () => TraceContext.clear());
     * processor.on('failed',    () => TraceContext.clear());
     * ```
     *
     * Active callers: adWorker, imageWorker, notificationDeliveryWorker,
     *                 notificationMatchWorker, paymentWorker, queueWrapper.
     */
    static clear(): void {
        storage.enterWith('');
    }
}
