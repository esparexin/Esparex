
export interface NotificationRepositoryPort {
    findById(id: string, session?: unknown): Promise<any | null>;
    save(notification: any, session?: unknown): Promise<any>;
    findByUserId(userId: string, pagination?: { limit: number; skip: number }, session?: unknown): Promise<any[]>;
    markAsRead(id: string, userId: string, session?: unknown): Promise<boolean>;
}
