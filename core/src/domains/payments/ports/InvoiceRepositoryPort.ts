export interface InvoiceRepositoryPort {
    findById(id: string, session?: unknown): Promise<any | null>;
    findByTransactionId(transactionId: string, session?: unknown): Promise<any | null>;
    save(invoice: any, session?: unknown): Promise<any>;
}
