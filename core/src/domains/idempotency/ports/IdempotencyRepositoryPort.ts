/**
 * IdempotencyRepositoryPort — Phase 3b (DECISION-GATE §5, areas/11 P-02).
 *
 * Persistence port for request idempotency records. The backend idempotency
 * middleware consumes this port via the `idempotencyRepository` composition
 * facade instead of importing the `IdempotencyRequest` Mongoose model
 * directly.
 */

export type IdempotencyRecordStatus = 'processing' | 'completed';

export interface IdempotencyRecordData {
    _id: unknown;
    userId: unknown;
    scope: string;
    key: string;
    requestHash: string;
    status: IdempotencyRecordStatus;
    responseStatus?: number;
    responseBody?: unknown;
    expiresAt: Date;
}

export interface MarkProcessingInput {
    userId: string;
    scope: string;
    key: string;
    requestHash: string;
    expiresAt: Date;
}

export interface IdempotencyRepositoryPort {
    findRequest(userId: string, scope: string, key: string): Promise<IdempotencyRecordData | null>;
    markProcessing(input: MarkProcessingInput): Promise<IdempotencyRecordData | null>;
    markCompleted(recordId: string, responseStatus: number, responseBody: unknown): Promise<void>;
}
