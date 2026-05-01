"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    Inbox,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { queryKeys } from "@/hooks/queries";
import { notificationApi, type Notification, type NotificationResponse } from "@/lib/api/user/notifications";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItemCard } from "@/components/user/NotificationItemCard";

type NotificationBellDropdownProps = {
    notificationsData?: NotificationResponse;
    unreadCount: number;
    onRefresh?: () => Promise<unknown>;
    variant?: "desktop" | "mobile";
};

const isExternalUrl = (href: string) => /^https?:\/\//i.test(href);

const resolveNotificationTarget = (href: string) => {
    if (typeof window === "undefined") {
        return {
            isExternal: isExternalUrl(href),
            href,
        };
    }

    try {
        const url = new URL(href, window.location.origin);
        const isExternal = url.origin !== window.location.origin;
        return {
            isExternal,
            href: isExternal ? url.toString() : `${url.pathname}${url.search}${url.hash}`,
        };
    } catch {
        return {
            isExternal: isExternalUrl(href),
            href: href.startsWith("/") ? href : `/${href.replace(/^\.?\//, "")}`,
        };
    }
};

const sortNotifications = (items: Notification[]) =>
    [...items].sort((a, b) => {
        // Just sort by date, keeping the list simple
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

export function NotificationBellDropdown({
    notificationsData,
    unreadCount,
    onRefresh,
    variant = "desktop",
}: NotificationBellDropdownProps) {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    const notifications = sortNotifications(
        Array.isArray(notificationsData?.notifications) ? notificationsData.notifications : []
    );

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    const syncNotificationCaches = (
        updater: (current: NotificationResponse) => NotificationResponse
    ) => {
        queryClient.setQueriesData<NotificationResponse | undefined>(
            { queryKey: queryKeys.notifications.all },
            (current) => {
                if (!current) return current;
                return updater(current);
            }
        );
    };

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationApi.markRead(id),
        onSuccess: (_response, id) => {
            const now = new Date().toISOString();
            syncNotificationCaches((current) => {
                const target = current.notifications.find((item) => item.id === id);
                return {
                    ...current,
                    notifications: current.notifications.map((item) =>
                        item.id === id ? { ...item, isRead: true, readAt: now } : item
                    ),
                    unreadCount: target && !target.isRead ? Math.max(0, current.unreadCount - 1) : current.unreadCount,
                };
            });
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllRead(),
        onSuccess: () => {
            const now = new Date().toISOString();
            syncNotificationCaches((current) => ({
                ...current,
                notifications: current.notifications.map((item) => ({
                    ...item,
                    isRead: true,
                    readAt: item.readAt || now,
                })),
                unreadCount: 0,
            }));
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });

    const handleNotificationSelect = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await markReadMutation.mutateAsync(notification.id);
            } catch {
                return;
            }
        }

        setOpen(false);

        if (!notification.actionUrl) {
            return;
        }

        const target = resolveNotificationTarget(notification.actionUrl);
        if (target.isExternal) {
            window.location.assign(target.href);
            return;
        }

        void router.push(target.href);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            void onRefresh?.();
        }
    };

    const triggerClassName =
        variant === "mobile"
            ? "h-11 w-11 rounded-full hover:bg-muted relative"
            : "h-11 w-11 rounded-full relative text-muted-foreground hover:text-foreground";
    const iconClassName = variant === "mobile" ? "h-6 w-6 text-foreground/80" : "h-5 w-5";

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={triggerClassName}
                    aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
                >
                    <Bell className={iconClassName} />
                    {unreadCount > 0 ? (
                        variant === "mobile" ? (
                            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full border-2 border-background bg-red-500" />
                        ) : (
                            <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-red-500 px-1 text-2xs font-bold text-white">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )
                    ) : null}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-[min(90vw,17rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-lg"
                onCloseAutoFocus={(event) => event.preventDefault()}
            >
                <div className="border-b border-slate-100 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">Notifications</p>
                        {unreadCount > 0 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 rounded-full px-2.5 text-[11px] font-medium text-foreground-tertiary hover:bg-slate-100"
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                            >
                                Mark all read
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="max-h-[18rem] overflow-y-auto px-1.5 py-1.5">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">
                                <Inbox className="h-4 w-4 text-foreground-subtle" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-foreground">No notifications</p>
                                <p className="text-[11px] leading-4 text-muted-foreground">Updates will appear here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {notifications.map((notification) => (
                                <NotificationItemCard
                                    key={notification.id}
                                    notification={notification}
                                    onSelect={handleNotificationSelect}
                                    isProcessing={markReadMutation.isPending}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
