"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
    Bell,
    Check,
    ChevronRight,
    Inbox,
    Megaphone,
    MessageCircleMore,
    ShoppingBag,
    Sparkles,
    Tag,
    type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { NotificationTypeValue } from "@shared/enums/notificationType";

import { queryKeys, useNotificationsQuery } from "@/hooks/queries";
import { notificationApi, type Notification } from "@/lib/api/user/notifications";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NotificationMeta = {
    label: string;
    icon: LucideIcon;
    iconTone: string;
    badgeTone: string;
};

const NOTIFICATION_META: Record<NotificationTypeValue, NotificationMeta> = {
    SYSTEM: {
        label: "System",
        icon: Megaphone,
        iconTone: "text-foreground-secondary",
        badgeTone: "border-slate-200 bg-slate-100 text-foreground-secondary",
    },
    CHAT: {
        label: "Message",
        icon: MessageCircleMore,
        iconTone: "text-sky-700",
        badgeTone: "border-sky-200 bg-sky-100 text-sky-700",
    },
    SMART_ALERT: {
        label: "Smart alert",
        icon: Sparkles,
        iconTone: "text-amber-700",
        badgeTone: "border-amber-200 bg-amber-100 text-amber-700",
    },
    AD_STATUS: {
        label: "Listing",
        icon: Tag,
        iconTone: "text-violet-700",
        badgeTone: "border-violet-200 bg-violet-100 text-violet-700",
    },
    BUSINESS_STATUS: {
        label: "Business",
        icon: Check,
        iconTone: "text-emerald-700",
        badgeTone: "border-emerald-200 bg-emerald-100 text-emerald-700",
    },
    ORDER_UPDATE: {
        label: "Order",
        icon: ShoppingBag,
        iconTone: "text-link-dark",
        badgeTone: "border-blue-200 bg-blue-100 text-link-dark",
    },
    PRICE_DROP: {
        label: "Price drop",
        icon: Tag,
        iconTone: "text-rose-700",
        badgeTone: "border-rose-200 bg-rose-100 text-rose-700",
    },
};

function NotificationRow({
    notification,
    onSelect,
    isProcessing,
}: {
    notification: Notification;
    onSelect: (notification: Notification) => void;
    isProcessing: boolean;
}) {
    const meta = NOTIFICATION_META[notification.type];
    const Icon = meta.icon;
    const relativeTime = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

    return (
        <button
            type="button"
            className={cn(
                "w-full rounded-2xl border px-4 py-4 text-left transition",
                notification.isRead
                    ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    : "border-blue-100 bg-blue-50/70 hover:border-blue-200 hover:bg-blue-50"
            )}
            onClick={() => onSelect(notification)}
            disabled={isProcessing}
        >
            <div className="flex gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Icon className={cn("h-5 w-5", meta.iconTone)} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={meta.badgeTone}>
                            {meta.label}
                        </Badge>
                        {!notification.isRead ? (
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-link-dark">
                                New
                            </Badge>
                        ) : null}
                    </div>

                    <p className={cn("mt-2 text-sm", notification.isRead ? "font-medium text-foreground-secondary" : "font-semibold text-foreground")}>
                        {notification.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-foreground-tertiary">{notification.message}</p>

                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{relativeTime}</span>
                        {notification.actionUrl ? (
                            <span className="inline-flex items-center gap-1 font-medium text-foreground-secondary">
                                Open
                                <ChevronRight className="h-3 w-3" />
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        </button>
    );
}

export default function NotificationsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data, isLoading } = useNotificationsQuery({ limit: 50 });

    const notifications = data?.notifications ?? [];
    const unreadCount = data?.unreadCount ?? 0;

    const syncCaches = (updater: (c: typeof data) => typeof data) => {
        queryClient.setQueriesData<typeof data>(
            { queryKey: queryKeys.notifications.all },
            (current) => (current ? updater(current) : current)
        );
    };

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationApi.markRead(id),
        onSuccess: (_r, id) => {
            const now = new Date().toISOString();
            syncCaches((current) => ({
                ...current!,
                notifications: current!.notifications.map((n) =>
                    n.id === id ? { ...n, isRead: true, readAt: now } : n
                ),
                unreadCount: Math.max(0, (current!.unreadCount ?? 0) - 1),
            }));
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllRead(),
        onSuccess: () => {
            const now = new Date().toISOString();
            syncCaches((current) => ({
                ...current!,
                notifications: current!.notifications.map((n) => ({ ...n, isRead: true, readAt: n.readAt || now })),
                unreadCount: 0,
            }));
        },
    });

    const handleSelect = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await markReadMutation.mutateAsync(notification.id);
            } catch {
                /* ignore */
            }
        }
        if (!notification.actionUrl) return;
        try {
            const url = new URL(notification.actionUrl, window.location.origin);
            if (url.origin === window.location.origin) {
                router.push(`${url.pathname}${url.search}${url.hash}`);
            } else {
                window.location.assign(url.toString());
            }
        } catch {
            router.push(notification.actionUrl);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
                            <Bell className="h-5 w-5 text-foreground-secondary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
                            {unreadCount > 0 ? (
                                <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">All caught up</p>
                            )}
                        </div>
                    </div>
                    {unreadCount > 0 ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full px-4 text-xs font-medium"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            Mark all read
                        </Button>
                    ) : null}
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
                            <Inbox className="h-6 w-6 text-foreground-subtle" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-foreground">No notifications yet</p>
                            <p className="text-sm leading-6 text-muted-foreground max-w-xs">
                                Updates about your listings, orders, and messages will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((notification) => (
                            <NotificationRow
                                key={notification.id}
                                notification={notification}
                                onSelect={handleSelect}
                                isProcessing={markReadMutation.isPending}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
