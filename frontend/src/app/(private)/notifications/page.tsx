"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    Inbox,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { queryKeys, useNotificationsQuery } from "@/hooks/queries";
import { notificationApi, type Notification } from "@/lib/api/user/notifications";
import { Button } from "@/components/ui/button";
import { NotificationItemCard } from "@/components/user/NotificationItemCard";

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
                            <NotificationItemCard
                                key={notification.id}
                                notification={notification}
                                onSelect={handleSelect}
                                isProcessing={markReadMutation.isPending}
                                density="default"
                                actionHint="open-only"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
