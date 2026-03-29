import type { NotificationTypeValue } from "@shared/enums/notificationType";

import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "../routes";

export interface Notification {
    id: string;
    userId: string;
    type: NotificationTypeValue;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
    actionUrl?: string;
    priority?: "low" | "medium" | "high";
    channels?: string[];
    deliveryStatus?: Record<string, "pending" | "sent" | "failed" | "skipped">;
    entityRef?: { domain: string; id: string };
}

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

type NotificationListParams = {
    page?: number;
    limit?: number;
    filter?: "all" | "unread";
    type?: string;
    q?: string;
};

interface BackendNotificationEnvelope {
    success: boolean;
    data: {
        notifications: Array<Record<string, unknown>>;
        pagination: NotificationResponse["pagination"];
        unreadCount: number;
    };
}

const normalizeNotification = (raw: Record<string, unknown>): Notification => ({
    id: String(raw.id || raw._id || ""),
    userId: String(raw.userId || ""),
    type: (raw.type as NotificationTypeValue) || "SYSTEM",
    title: String(raw.title || ""),
    message: String(raw.message || ""),
    data:
        typeof raw.data === "object" && raw.data !== null
            ? (raw.data as Record<string, unknown>)
            : undefined,
    isRead: Boolean(raw.isRead),
    readAt: typeof raw.readAt === "string" ? raw.readAt : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    actionUrl:
        typeof raw.actionUrl === "string"
            ? raw.actionUrl
            : typeof (raw.data as { link?: unknown } | undefined)?.link === "string"
              ? ((raw.data as { link?: string }).link ?? undefined)
              : undefined,
    priority:
        raw.priority === "low" || raw.priority === "medium" || raw.priority === "high"
            ? raw.priority
            : undefined,
    channels: Array.isArray(raw.channels) ? raw.channels.filter((value): value is string => typeof value === "string") : undefined,
    deliveryStatus:
        typeof raw.deliveryStatus === "object" && raw.deliveryStatus !== null
            ? (raw.deliveryStatus as Record<string, "pending" | "sent" | "failed" | "skipped">)
            : undefined,
    entityRef:
        typeof raw.entityRef === "object" && raw.entityRef !== null
            ? (raw.entityRef as { domain: string; id: string })
            : undefined,
});

const buildNotificationListQuery = ({ page = 1, limit = 20, filter = "all", type = "all", q = "" }: NotificationListParams) => {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (filter !== "all") params.set("filter", filter);
    if (type !== "all") params.set("type", type);
    if (q.trim()) params.set("q", q.trim());

    return params.toString();
};

export const notificationApi = {
    getAll: async (params: NotificationListParams = {}): Promise<NotificationResponse> => {
        const page = params.page ?? 1;
        const limit = params.limit ?? 20;
        const query = buildNotificationListQuery(params);
        const raw = await apiClient.get<BackendNotificationEnvelope>(`${API_ROUTES.USER.NOTIFICATIONS}?${query}`);
        const inner = raw?.data ?? (raw as unknown as NotificationResponse);
        const notifications = Array.isArray((inner as any).notifications)
            ? (inner as any).notifications.map(normalizeNotification)
            : [];

        return {
            success: Boolean(raw?.success ?? true),
            notifications,
            pagination: (inner as any).pagination ?? { page, limit, total: 0, pages: 0 },
            unreadCount: typeof (inner as any).unreadCount === "number" ? (inner as any).unreadCount : 0,
        };
    },

    markRead: async (id: string) => apiClient.put(API_ROUTES.USER.NOTIF_MARK_READ(id)),

    markAllRead: async () => apiClient.put(API_ROUTES.USER.NOTIF_MARK_ALL_READ),

    deleteNotification: async (id: string) => apiClient.delete(API_ROUTES.USER.NOTIF_DELETE(id)),

    registerToken: async (token: string, platform: "web" | "android" | "ios" = "web") =>
        apiClient.post(API_ROUTES.USER.NOTIF_REGISTER, { token, platform }),
};
