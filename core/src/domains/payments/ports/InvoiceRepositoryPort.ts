export interface InvoiceRepositoryPort {
    findById(id: string, session?: unknown): Promise<Record<string, unknown> | null>;
    findByTransactionId(transactionId: string, session?: unknown): Promise<Record<string, unknown> | null>;
    save(invoice: Record<string, unknown>, session?: unknown): Promise<Record<string, unknown>>;
}
