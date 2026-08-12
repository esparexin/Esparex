export interface UserReadRepositoryPort {
    findById(userId: string): Promise<Record<string, unknown> | null>;
    findEmail(userId: string): Promise<string | null>;
}
