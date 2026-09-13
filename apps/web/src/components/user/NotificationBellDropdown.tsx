"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@esparex/ui";
import { queryKeys } from "@/hooks/queries";
import { notificationApi, type Notification, type NotificationResponse } from "@/lib/api/user/notifications";
import { NotificationDrawer } from "@/components/user/NotificationDrawer";
import { NotificationDropdownBody } from "./NotificationDropdownBody";

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
    // Keying DropdownMenu by pathname auto-unmounts/remounts on navigation,
    // which closes the dropdown without needing a setState inside an effect.

    const [open, setOpen] = useState(false);

    const notifications = sortNotifications(
        Array.isArray(notificationsData?.notifications) ? notificationsData.notifications : []
    );
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
                notifications: current.notifications.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now })),
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
            : "h-9 w-9 rounded-full relative text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer";
    const iconClassName = variant === "mobile" ? "h-6 w-6 text-foreground/80" : "h-4.5 w-4.5";

    if (variant === "mobile") {
        return (
            <NotificationDrawer
                open={open}
                onOpenChange={handleOpenChange}
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkRead={(id) => markReadMutation.mutateAsync(id).then(() => {})}
                onMarkAllRead={() => markAllReadMutation.mutateAsync().then(() => {})}
                onSelect={handleNotificationSelect}
                trigger={
                    <Button
                        variant="ghost"
                        size="icon"
                        className={triggerClassName}
                        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
                    >
                        <Bell className={iconClassName} />
                        {unreadCount > 0 ? (
                            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full border-2 border-background bg-destructive" />
                        ) : null}
                    </Button>
                }
            />
        );
    }

    return (
        <DropdownMenu key={pathname} modal={false} open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={triggerClassName}
                    aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
                >
                    <Bell className={iconClassName} />
                    {unreadCount > 0 ? (
                        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-tiny font-bold text-destructive-foreground shadow-xs animate-in zoom-in-50">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="z-[50] w-[min(90vw,22rem)] rounded-2xl border border-border bg-popover text-popover-foreground p-0 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onPointerDownOutside={(e) => {
                    if ((e.target as HTMLElement | null)?.closest('[data-slot="dropdown-menu-trigger"]')) {
                        e.preventDefault();
                    }
                    setOpen(false);
                }}
                onInteractOutside={() => setOpen(false)}
            >
                <NotificationDropdownBody
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAllRead={() => markAllReadMutation.mutate()}
                    isMarkingAllRead={markAllReadMutation.isPending}
                    onSelectNotification={handleNotificationSelect}
                    isMarkingRead={markReadMutation.isPending}
                    onViewAll={() => {
                        setOpen(false);
                        void router.push("/notifications");
                    }}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
