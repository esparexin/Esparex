export interface NotificationLog {
    id: string;
    title: string;
    body: string;
    type: string;
    targetType: 'all' | 'users' | 'topic';
    targetValue?: string;
    successCount: number;
    failureCount: number;
    sentBy: string | { _id: string; firstName: string; lastName: string; email: string };
    status: 'sent' | 'failed' | 'scheduled';
    createdAt: string;
}
