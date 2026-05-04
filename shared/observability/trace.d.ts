export declare class TraceContext {
    static getCorrelationId(): string;
    /**
     * Set the correlationId for the current async context (and all its children).
     * Uses AsyncLocalStorage so concurrent requests never share state.
     */
    static setCorrelationId(id: string): void;
    static clear(): void;
}
//# sourceMappingURL=trace.d.ts.map