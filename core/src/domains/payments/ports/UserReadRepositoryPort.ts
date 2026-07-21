export interface UserReadRepositoryPort {
    findById(userId: string): Promise<any | null>;
    findEmail(userId: string): Promise<string | null>;
}
