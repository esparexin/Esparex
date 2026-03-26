import { v4 as uuidv4 } from 'uuid';

let currentCorrelationId: string | null = null;

export class TraceContext {
    static getCorrelationId(): string {
        if (!currentCorrelationId) {
            currentCorrelationId = uuidv4() as string;
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
