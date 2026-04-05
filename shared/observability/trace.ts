let currentCorrelationId: string | null = null;

export class TraceContext {
    static getCorrelationId(): string {
        if (!currentCorrelationId) {
            currentCorrelationId = crypto.randomUUID();
        }
        return currentCorrelationId!;
    }

    static setCorrelationId(id: string): void {
        currentCorrelationId = id;
    }

    static clear(): void {
        currentCorrelationId = null;
    }
}
