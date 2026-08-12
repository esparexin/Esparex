export interface WalletRepositoryPort {
    findByUserId(userId: string, session?: unknown): Promise<Record<string, unknown> | null>;
    incrementBalance(userId: string, amount: number, session?: unknown): Promise<Record<string, unknown> | null>;
    decrementBalance(userId: string, amount: number, session?: unknown): Promise<Record<string, unknown> | null>;
    save(wallet: Record<string, unknown>, session?: unknown): Promise<Record<string, unknown>>;
}
