export interface TransactionRepositoryPort {
    findById(id: string, session?: unknown): Promise<any | null>;
    findByGatewayPaymentId(paymentId: string, session?: unknown): Promise<any | null>;
    save(transaction: any, session?: unknown): Promise<any>;
    updateStatus(id: string, status: string, session?: unknown): Promise<any>;
}
