export interface WalletRepositoryPort {
    findByUserId(userId: string, session?: unknown): Promise<any | null>;
    incrementBalance(userId: string, amount: number, session?: unknown): Promise<any>;
    decrementBalance(userId: string, amount: number, session?: unknown): Promise<any>;
    save(wallet: any, session?: unknown): Promise<any>;
}
