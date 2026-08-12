export interface BusinessReadRepositoryPort {
    findByUserId(userId: string): Promise<Record<string, unknown> | null>;
}
