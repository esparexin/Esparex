"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    ChevronRight,
    Inbox,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { READ_NOTIFICATION_RETENTION_HOURS } from "@shared/constants/notificationRetention";

import { queryKeys } from "@/hooks/queries";
import { notificationApi, type Notification, type NotificationResponse } from "@/lib/api/user/notifications";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItemCard } from "@/components/user/NotificationItemCard";

type NotificationBellDropdownProps = {
    notificationsData?: NotificationResponse;
    unreadCount: number;
    onRefresh?: () => Promise<unknown>;
    variant?: "desktop" | "mobile";
};

const MAX_UNREAD_ITEMS = 6;
const MAX_RECENT_READ_ITEMS = 3;

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
        if (a.isRead !== b.isRead) {
            return Number(a.isRead) - Number(b.isRead);
        }
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

    const notifications = useMemo(
        () => sortNotifications(Array.isArray(notificationsData?.notifications) ? notificationsData.notifications : []),
        [notificationsData?.notifications]
    );
    const unreadItems = notifications.filter((item) => !item.isRead).slice(0, MAX_UNREAD_ITEMS);
    const recentReadItems = notifications.filter((item) => item.isRead).slice(0, MAX_RECENT_READ_ITEMS);

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
                sideOffset={10}
                className="w-[min(92vw,26rem)] rounded-3xl border border-slate-200 bg-white p-0 shadow-xl"
                onCloseAutoFocus={(event) => event.preventDefault()}
            >
                <div className="border-b border-slate-100 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Notifications</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Read messages stay here briefly and disappear after about {READ_NOTIFICATION_RETENTION_HOURS} hours.
                            </p>
                        </div>
                        {unreadCount > 0 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 h-11 rounded-full px-3 text-xs font-medium text-foreground-tertiary hover:bg-slate-100"
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                            >
                                Mark all read
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="max-h-[26rem] overflow-y-auto px-3 py-3">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                                <Inbox className="h-5 w-5 text-foreground-subtle" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">No new notifications</p>
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Short updates will appear here and clear out automatically after you read them.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {unreadItems.length > 0 ? (
                                <section className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                                            Unread now
                                        </p>
                                        <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                                    </div>
                                    <div className="space-y-2">
                                        {unreadItems.map((notification) => (
                                            <NotificationItemCard
                                                key={notification.id}
                                                notification={notification}
                                                onSelect={handleNotificationSelect}
                                                isProcessing={markReadMutation.isPending}
                                                density="compact"
                                                actionHint="always"
                                            />
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            {recentReadItems.length > 0 ? (
                                <>
                                    {unreadItems.length > 0 ? <DropdownMenuSeparator className="mx-1" /> : null}
                                    <section className="space-y-2">
                                        <div className="px-1">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                                                Read recently
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            {recentReadItems.map((notification) => (
                                                <NotificationItemCard
                                                    key={notification.id}
                                                    notification={notification}
                                                    onSelect={handleNotificationSelect}
                                                    isProcessing={markReadMutation.isPending}
                                                    density="compact"
                                                    actionHint="always"
                                                />
                                            ))}
                                        </div>
                                    </section>
                                </>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 px-3 py-3">
                    <Link
                        href="/notifications"
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-foreground-tertiary transition hover:bg-slate-50 hover:text-foreground-secondary"
                        onClick={() => setOpen(false)}
                    >
                        View all notifications
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
