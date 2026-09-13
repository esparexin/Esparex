"use client";

import { Bell, Button, DropdownMenuItem } from "@esparex/ui";
import { type Notification } from "@/lib/api/user/notifications";
import { NotificationItemCard } from "@/components/user/NotificationItemCard";

interface NotificationDropdownBodyProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAllRead: () => void;
    isMarkingAllRead: boolean;
    onSelectNotification: (notification: Notification) => void;
    isMarkingRead: boolean;
    onViewAll: () => void;
}

export function NotificationDropdownBody({
    notifications,
    unreadCount,
    onMarkAllRead,
    isMarkingAllRead,
    onSelectNotification,
    isMarkingRead,
    onViewAll,
}: NotificationDropdownBodyProps) {
    return (
        <>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/70 bg-muted/20">
                <div className="flex items-center gap-2">
                    <p className="text-body font-bold text-foreground">Notifications</p>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-tiny font-semibold bg-primary/10 text-primary border border-primary/20">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                {unreadCount > 0 ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg px-2.5 text-caption font-semibold text-primary hover:text-primary-hover hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={onMarkAllRead}
                        disabled={isMarkingAllRead}
                    >
                        Mark all read
                    </Button>
                ) : null}
            </div>

            <div className="max-h-[min(26rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain p-1.5 space-y-1">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center rounded-2xl bg-muted/30 m-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-border/60 text-muted-foreground shadow-xs">
                            <Bell className="h-6 w-6 text-foreground-subtle" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-body font-semibold text-foreground">All caught up!</p>
                            <p className="text-caption text-muted-foreground max-w-[240px] leading-relaxed">
                                You don&apos;t have any notifications right now. Activity on your ads and chats will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                asChild
                                className="p-0 border-none rounded-xl focus:bg-transparent data-[highlighted]:bg-transparent outline-none cursor-pointer"
                            >
                                <NotificationItemCard
                                    notification={notification}
                                    onSelect={onSelectNotification}
                                    isProcessing={isMarkingRead}
                                />
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </div>

            {notifications.length > 0 && (
                <div className="border-t border-border/70 p-2 bg-muted/20 text-center">
                    <DropdownMenuItem
                        asChild
                        className="p-0 border-none rounded-lg focus:bg-transparent data-[highlighted]:bg-transparent outline-none"
                    >
                        <button
                            type="button"
                            onClick={onViewAll}
                            className="w-full py-1.5 text-caption font-semibold text-foreground-secondary hover:text-primary transition-colors cursor-pointer"
                        >
                            View all notifications
                        </button>
                    </DropdownMenuItem>
                </div>
            )}
        </>
    );
}
