"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertTriangle,
    Bell,
    Check,
    CheckCircle2,
    Clock,
    Megaphone,
    ShoppingBag,
    Tag,
} from "lucide-react";

import { notify } from "@/lib/notify";
import { notificationApi, type Notification, type NotificationResponse } from "@/lib/api/user/notifications";
import { queryKeys, useNotificationsQuery } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageStateGuard, PageState } from "@/components/ui/PageStateGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useMounted } from "@/hooks/useMounted";
import { formatStableDate } from "@/lib/formatters";

export function Notifications() {
    const { status } = useAuth();
    const mounted = useMounted();
    const queryClient = useQueryClient();
    const page = 1;
    const limit = 20;
    const notificationsQueryKey = queryKeys.notifications.list(page, limit);

    const { data, isLoading, isError, refetch } = useNotificationsQuery({
        page,
        limit,
        enabled: status === "authenticated",
    });

    const notifications = useMemo(
        () => (Array.isArray(data?.notifications) ? data.notifications : []),
        [data]
    );
    const unreadCount = typeof data?.unreadCount === "number" ? data.unreadCount : 0;

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationApi.markRead(id),
        onSuccess: (_response, id) => {
            queryClient.setQueryData<NotificationResponse | undefined>(notificationsQueryKey, (current) => {
                if (!current) return current;
                const nextNotifications = current.notifications.map((item) =>
                    item.id === id ? { ...item, isRead: true } : item
                );
                const nextUnread = Math.max(0, nextNotifications.filter((item) => !item.isRead).length);
                return {
                    ...current,
                    notifications: nextNotifications,
                    unreadCount: nextUnread,
                };
            });
        },
        onError: () => {
            notify.error("Failed to mark as read");
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllRead(),
        onSuccess: () => {
            queryClient.setQueryData<NotificationResponse | undefined>(notificationsQueryKey, (current) => {
                if (!current) return current;
                return {
                    ...current,
                    notifications: current.notifications.map((item) => ({ ...item, isRead: true })),
                    unreadCount: 0,
                };
            });
            notify.success("All marked as read");
        },
        onError: () => {
            notify.error("Failed to mark all as read");
        },
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "SMART_ALERT":
                return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case "ORDER_UPDATE":
                return <ShoppingBag className="h-5 w-5 text-blue-500" />;
            case "AD_STATUS":
                return <Tag className="h-5 w-5 text-purple-500" />;
            case "BUSINESS_STATUS":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "PRICE_DROP":
                return <Tag className="h-5 w-5 text-red-500" />;
            case "SYSTEM":
                return <Megaphone className="h-5 w-5 text-gray-500" />;
            default:
                return <Bell className="h-5 w-5 text-blue-500" />;
        }
    };

    const pageState: PageState = isLoading
        ? "loading"
        : isError
            ? "error"
            : notifications.length === 0
                ? "empty"
                : "ready";

    return (
        <Card className="max-w-4xl mx-auto border-0 shadow-none md:border md:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Bell className="h-6 w-6 text-blue-600" />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Stay updated with your ads, orders, and alerts
                    </CardDescription>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAllReadMutation.mutate()}
                        className="gap-2"
                        disabled={markAllReadMutation.isPending}
                    >
                        <Check className="h-4 w-4" />
                        Mark all read
                    </Button>
                )}
            </CardHeader>

            <CardContent>
                <PageStateGuard
                    state={pageState}
                    loading={
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4 p-4 border rounded-xl">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                    empty={
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
                            <Bell className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <h3 className="font-medium text-slate-900">No notifications yet</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                We&apos;ll notify you when something important happens.
                            </p>
                        </div>
                    }
                    error={
                        <div className="text-center py-12 text-red-500">
                            <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="font-medium">Failed to load notifications</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">Retry</Button>
                        </div>
                    }
                >
                    <div className="space-y-3">
                        {notifications.map((notification: Notification) => (
                            <div
                                key={notification.id}
                                className={`flex gap-4 p-4 rounded-xl border transition-all hover:bg-slate-50 ${!notification.isRead ? "bg-blue-50/50 border-blue-100" : "bg-white border-slate-100"
                                    }`}
                                onClick={() => {
                                    if (!notification.isRead && !markReadMutation.isPending) {
                                        markReadMutation.mutate(notification.id);
                                    }
                                }}
                            >
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!notification.isRead ? "bg-white shadow-sm" : "bg-slate-100"
                                    }`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className={`text-sm ${!notification.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"
                                            }`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {mounted
                                                ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                                                : formatStableDate(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                        {notification.message}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </PageStateGuard>
            </CardContent>
        </Card>
    );
}
