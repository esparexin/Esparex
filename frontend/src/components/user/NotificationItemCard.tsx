"use client";

import { formatDistanceToNow } from "date-fns";
import {
    Check,
    ChevronRight,
    Megaphone,
    MessageCircleMore,
    ShoppingBag,
    Sparkles,
    Tag,
    type LucideIcon,
} from "lucide-react";

import type { NotificationTypeValue } from "@shared/enums/notificationType";

import type { Notification } from "@/lib/api/user/notifications";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type NotificationMeta = {
    label: string;
    icon: LucideIcon;
    iconTone: string;
    badgeTone: string;
};

export const NOTIFICATION_META: Record<NotificationTypeValue, NotificationMeta> = {
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

type NotificationItemCardProps = {
    notification: Notification;
    onSelect: (notification: Notification) => void;
    isProcessing: boolean;
    density?: "default" | "compact";
    actionHint?: "always" | "open-only";
};

export function NotificationItemCard({
    notification,
    onSelect,
    isProcessing,
    density = "default",
    actionHint = "always",
}: NotificationItemCardProps) {
    const meta = NOTIFICATION_META[notification.type];
    const Icon = meta.icon;
    const isCompact = density === "compact";
    const relativeTime = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

    const actionText = notification.actionUrl ? "Open" : notification.isRead ? "Read" : "Mark read";
    const showActionHint = actionHint === "always" || (actionHint === "open-only" && Boolean(notification.actionUrl));

    return (
        <button
            type="button"
            className={cn(
                "w-full rounded-2xl border text-left transition",
                isCompact ? "px-3 py-3" : "px-4 py-4",
                notification.isRead
                    ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    : "border-blue-100 bg-blue-50/70 hover:border-blue-200 hover:bg-blue-50"
            )}
            onClick={() => onSelect(notification)}
            disabled={isProcessing}
        >
            <div className={cn("flex", isCompact ? "gap-3" : "gap-4")}>
                <div
                    className={cn(
                        "mt-0.5 flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white",
                        isCompact ? "h-9 w-9" : "h-10 w-10"
                    )}
                >
                    <Icon className={cn(meta.iconTone, isCompact ? "h-4 w-4" : "h-5 w-5")} />
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

                    <p
                        className={cn(
                            "mt-2 text-sm",
                            isCompact ? "line-clamp-1" : "",
                            notification.isRead ? "font-medium text-foreground-secondary" : "font-semibold text-foreground"
                        )}
                    >
                        {notification.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-foreground-tertiary">{notification.message}</p>

                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{relativeTime}</span>
                        {showActionHint ? (
                            <span className="inline-flex items-center gap-1 font-medium text-foreground-secondary">
                                {actionText}
                                <ChevronRight className="h-3 w-3" />
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        </button>
    );
}
