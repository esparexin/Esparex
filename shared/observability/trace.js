"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceContext = void 0;
function createFallbackStorage() {
    let current = '';
    return {
        getStore: () => (current.length > 0 ? current : undefined),
        enterWith: (value) => {
            current = value;
        },
    };
}
function createTraceStorage() {
    // Browser/client bundles cannot resolve Node built-ins like async_hooks.
    const runtime = globalThis;
    if (typeof runtime.window !== 'undefined') {
        return createFallbackStorage();
    }
    try {
        const dynamicRequire = Function("return typeof require === 'function' ? require : null")();
        if (!dynamicRequire)
            return createFallbackStorage();
        const asyncHooks = dynamicRequire('node:async_hooks');
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
            enterWith: (value) => storage.enterWith(value),
        };
    }
    catch {
        return createFallbackStorage();
    }
}
const storage = createTraceStorage();
class TraceContext {
    static getCorrelationId() {
        return storage.getStore() ?? 'no-context';
    }
    /**
     * Set the correlationId for the current async context (and all its children).
     * Uses AsyncLocalStorage so concurrent requests never share state.
     */
    static setCorrelationId(id) {
        storage.enterWith(id);
    }
    static clear() {
        storage.enterWith('');
    }
}
exports.TraceContext = TraceContext;
//# sourceMappingURL=trace.js.map