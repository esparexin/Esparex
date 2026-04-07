"use client";

import { useEffect, useMemo, useState } from "react";
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
import { usePathname, useRouter } from "next/navigation";

import { READ_NOTIFICATION_RETENTION_HOURS } from "@shared/constants/notificationRetention";
import type { NotificationTypeValue } from "@shared/enums/notificationType";

import { queryKeys } from "@/hooks/queries";
import { notificationApi, type Notification, type NotificationResponse } from "@/lib/api/user/notifications";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationBellDropdownProps = {
    notificationsData?: NotificationResponse;
    unreadCount: number;
    onRefresh?: () => Promise<unknown>;
    variant?: "desktop" | "mobile";
};

type NotificationMeta = {
    label: string;
    icon: LucideIcon;
    iconTone: string;
    badgeTone: string;
};

const MAX_UNREAD_ITEMS = 6;
const MAX_RECENT_READ_ITEMS = 3;

const NOTIFICATION_META: Record<NotificationTypeValue, NotificationMeta> = {
    SYSTEM: {
        label: "System",
        icon: Megaphone,
        iconTone: "text-slate-700",
        badgeTone: "border-slate-200 bg-slate-100 text-slate-700",
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

function NotificationDropdownRow({
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
                "w-full rounded-2xl border px-3 py-3 text-left transition",
                notification.isRead
                    ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    : "border-blue-100 bg-blue-50/70 hover:border-blue-200 hover:bg-blue-50"
            )}
            onClick={() => onSelect(notification)}
            disabled={isProcessing}
        >
            <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Icon className={cn("h-4 w-4", meta.iconTone)} />
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

                    <p className={cn("mt-2 line-clamp-1 text-sm", notification.isRead ? "font-medium text-slate-800" : "font-semibold text-foreground")}>
                        {notification.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{notification.message}</p>

                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{relativeTime}</span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            {notification.actionUrl ? "Open" : notification.isRead ? "Read" : "Mark read"}
                            <ChevronRight className="h-3 w-3" />
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}

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
                                className="shrink-0 h-11 rounded-full px-3 text-xs font-medium text-slate-600 hover:bg-slate-100"
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
                                <Inbox className="h-5 w-5 text-slate-400" />
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
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Unread now
                                        </p>
                                        <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                                    </div>
                                    <div className="space-y-2">
                                        {unreadItems.map((notification) => (
                                            <NotificationDropdownRow
                                                key={notification.id}
                                                notification={notification}
                                                onSelect={handleNotificationSelect}
                                                isProcessing={markReadMutation.isPending}
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
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Read recently
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            {recentReadItems.map((notification) => (
                                                <NotificationDropdownRow
                                                    key={notification.id}
                                                    notification={notification}
                                                    onSelect={handleNotificationSelect}
                                                    isProcessing={markReadMutation.isPending}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
