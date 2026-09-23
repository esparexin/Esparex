"use client";

import {
    Megaphone,
    MessageCircleMore,
    ShoppingBag,
    Sparkles,
    Tag,
    Check,
    type LucideIcon,
} from "@esparex/ui";
import { NotificationTypeValue } from "@esparex/contracts";
import { RelativeTimeText } from "@/components/common/RelativeTimeText";
import type { Notification } from "@/lib/api/user/notifications";
import { cn } from "@/lib/utils";

type NotificationMeta = {
    icon: LucideIcon;
    iconTone: string;
};

export const NOTIFICATION_META: Record<NotificationTypeValue, NotificationMeta> = {
    SYSTEM: {
        icon: Megaphone,
        iconTone: "text-muted-foreground",
    },
    CHAT: {
        icon: MessageCircleMore,
        iconTone: "text-primary",
    },
    SMART_ALERT: {
        icon: Sparkles,
        iconTone: "text-warning",
    },
    AD_STATUS: {
        icon: Tag,
        iconTone: "text-foreground-secondary",
    },
    BUSINESS_STATUS: {
        icon: Check,
        iconTone: "text-success",
    },
    ORDER_UPDATE: {
        icon: ShoppingBag,
        iconTone: "text-primary",
    },
    PRICE_DROP: {
        icon: Tag,
        iconTone: "text-destructive",
    },
    CATALOG_ITEM_APPROVED: {
        icon: Check,
        iconTone: "text-success",
    },
};

type NotificationItemCardProps = {
    notification: Notification;
    onSelect: (notification: Notification) => void;
    isProcessing: boolean;
};

export function NotificationItemCard({
    notification,
    onSelect,
    isProcessing,
}: NotificationItemCardProps) {
    const meta = NOTIFICATION_META[notification.type] || NOTIFICATION_META.SYSTEM;
    const Icon = meta.icon;

    return (
        <button
            type="button"
            className={cn(
                "group relative w-full rounded-xl text-left transition-all p-2.5 flex items-start gap-3 cursor-pointer select-none border border-border/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus:outline-none",
                "data-[highlighted]:bg-muted/70",
                notification.isRead
                    ? "bg-card hover:bg-muted/50 text-muted-foreground"
                    : "bg-primary/5 hover:bg-primary/10 text-foreground border-primary/20 shadow-xs"
            )}
            onClick={() => onSelect(notification)}
            disabled={isProcessing}
            aria-label={`${notification.isRead ? "" : "Unread notification: "}${notification.title}`}
        >
            <div
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-xs transition-transform group-hover:scale-105",
                    "h-9 w-9 mt-0.5",
                    !notification.isRead && "border-primary/20 bg-background"
                )}
            >
                <Icon className={cn(meta.iconTone, "h-4.5 w-4.5")} />
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-center pr-2">
                <div className="flex items-center justify-between gap-1.5">
                    <p
                        className={cn(
                            "text-body truncate leading-snug",
                            notification.isRead ? "font-medium text-foreground-secondary" : "font-bold text-foreground"
                        )}
                    >
                        {notification.title}
                    </p>
                    <span className="shrink-0 text-tiny font-medium text-muted-foreground/70">
                        <RelativeTimeText value={notification.createdAt} />
                    </span>
                </div>
                <p
                    className={cn(
                        "mt-1 line-clamp-2 text-caption leading-relaxed",
                        notification.isRead ? "text-muted-foreground" : "text-foreground-secondary font-medium"
                    )}
                >
                    {notification.message}
                </p>
            </div>

            {!notification.isRead && (
                <span
                    className="absolute top-3.5 right-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
                    aria-hidden="true"
                />
            )}
        </button>
    );
}
