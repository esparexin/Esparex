"use client";

import {
    Megaphone,
    MessageCircleMore,
    ShoppingBag,
    Sparkles,
    Tag,
    Check,
    type LucideIcon,
} from "lucide-react";

import type { NotificationTypeValue } from "@shared/enums/notificationType";
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
        iconTone: "text-slate-500",
    },
    CHAT: {
        icon: MessageCircleMore,
        iconTone: "text-sky-600",
    },
    SMART_ALERT: {
        icon: Sparkles,
        iconTone: "text-amber-500",
    },
    AD_STATUS: {
        icon: Tag,
        iconTone: "text-violet-600",
    },
    BUSINESS_STATUS: {
        icon: Check,
        iconTone: "text-emerald-600",
    },
    ORDER_UPDATE: {
        icon: ShoppingBag,
        iconTone: "text-blue-600",
    },
    PRICE_DROP: {
        icon: Tag,
        iconTone: "text-rose-600",
    },
    CATALOG_ITEM_APPROVED: {
        icon: Check,
        iconTone: "text-emerald-600",
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
                "w-full rounded-xl border text-left transition-all active:scale-[0.98]",
                "px-2.5 py-2",
                notification.isRead
                    ? "border-slate-100 bg-white hover:bg-slate-50/50"
                    : "border-blue-50 bg-blue-50/10 hover:bg-blue-50/40 shadow-sm"
            )}
            onClick={() => onSelect(notification)}
            disabled={isProcessing}
        >
            <div className="flex gap-2">
                <div
                    className={cn(
                        "flex shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm",
                        "h-7 w-7"
                    )}
                >
                    <Icon className={cn(meta.iconTone, "h-3 w-3")} />
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-1.5">
                        <p
                            className={cn(
                                "text-xs truncate",
                                notification.isRead ? "font-medium text-slate-500" : "font-bold text-slate-900"
                            )}
                        >
                            {notification.title}
                        </p>
                        <span className="shrink-0 text-[10px] font-medium text-slate-400">
                            <RelativeTimeText value={notification.createdAt} />
                        </span>
                    </div>
                    <p
                        className={cn(
                            "mt-0.5 line-clamp-1 text-[11px] leading-4",
                            notification.isRead ? "text-slate-400" : "text-slate-600 font-medium"
                        )}
                    >
                        {notification.message}
                    </p>
                </div>
            </div>
        </button>
    );
}
