import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "../routes";
import type { NotificationTypeValue } from "@shared/enums/notificationType";

export interface Notification {
    id: string;
    userId: string;
    type: NotificationTypeValue;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
}

/** Flat shape that components consume */
export interface NotificationResponse {
    success: boolean;
    notifications: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    unreadCount: number;
}

/** Raw envelope the backend actually sends: { success, data: { notifications, ... } } */
interface BackendNotificationEnvelope {
    success: boolean;
    data: {
        notifications: Array<Record<string, unknown>>;
        pagination: NotificationResponse['pagination'];
        unreadCount: number;
    };
}

const normalizeNotification = (raw: Record<string, unknown>): Notification => ({
    id: String(raw.id || raw._id || ''),
    userId: String(raw.userId || ''),
    type: (raw.type as NotificationTypeValue) || 'SYSTEM',
    title: String(raw.title || ''),
    message: String(raw.message || ''),
    data: typeof raw.data === 'object' && raw.data !== null
        ? raw.data as Record<string, unknown>
        : undefined,
    isRead: Boolean(raw.isRead),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
});

export const notificationApi = {
    getAll: async (page = 1, limit = 20): Promise<NotificationResponse> => {
        const raw = await apiClient.get<BackendNotificationEnvelope>(
            `${API_ROUTES.USER.NOTIFICATIONS}?page=${page}&limit=${limit}`
        );
        // Unwrap backend envelope → flat NotificationResponse
        const inner = raw?.data ?? (raw as unknown as NotificationResponse);
        const notifications = Array.isArray((inner as any).notifications)
            ? (inner as any).notifications.map(normalizeNotification)
            : [];
        return {
            success: Boolean(raw?.success ?? true),
            notifications,
            pagination: (inner as any).pagination ?? { page, limit, total: 0, pages: 0 },
            unreadCount: typeof (inner as any).unreadCount === 'number' ? (inner as any).unreadCount : 0,
        };
    },

    markRead: async (id: string) => {
        const response = await apiClient.put(API_ROUTES.USER.NOTIF_MARK_READ(id));
        return response;
    },

    markAllRead: async () => {
        const response = await apiClient.put(API_ROUTES.USER.NOTIF_MARK_ALL_READ);
        return response;
    },

    registerToken: async (token: string, platform: 'web' | 'android' | 'ios' = 'web') => {
        const response = await apiClient.post(API_ROUTES.USER.NOTIF_REGISTER, { token, platform });
        return response;
    }
};
