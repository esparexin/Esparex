export interface BusinessReadRepositoryPort {
    findByUserId(userId: string): Promise<any | null>;
}
