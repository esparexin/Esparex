import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage<string>();

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
