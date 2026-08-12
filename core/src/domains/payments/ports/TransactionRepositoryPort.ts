export interface TransactionRepositoryPort {
    findById(id: string, session?: unknown): Promise<Record<string, unknown> | null>;
    findByGatewayPaymentId(paymentId: string, session?: unknown): Promise<Record<string, unknown> | null>;
    save(transaction: Record<string, unknown>, session?: unknown): Promise<Record<string, unknown>>;
    updateStatus(id: string, status: string, session?: unknown): Promise<Record<string, unknown> | null>;
}
