export interface NotificationLog {
    id: string;
    title: string;
    body: string;
    type: string;
    targetType: 'all' | 'users' | 'topic';
    targetValue?: string;
    userIds?: string[];
    actionUrl?: string;
    successCount: number;
    skippedCount: number;
    failureCount: number;
    sentBy: string | { _id: string; firstName: string; lastName: string; email: string } | null;
    status: 'sent' | 'failed' | 'scheduled';
    createdAt: string;
    sendAt?: string;
}
