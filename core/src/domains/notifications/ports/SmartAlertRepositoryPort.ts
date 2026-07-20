
export interface SmartAlertRepositoryPort {
    findById(id: string, session?: unknown): Promise<any | null>;
    save(alert: any, session?: unknown): Promise<any>;
    findByUserId(userId: string, session?: unknown): Promise<any[]>;
    delete(id: string, userId: string, session?: unknown): Promise<boolean>;
}
