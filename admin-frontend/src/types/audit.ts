export interface AdminLog {
    id: string;
    adminId: string | { _id: string; firstName: string; lastName: string; email: string };
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}
