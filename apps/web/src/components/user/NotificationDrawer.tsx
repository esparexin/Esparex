"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Trash2, Inbox } from "lucide-react";
import { type Notification } from "@/lib/api/user/notifications";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export interface NotificationDrawerProps {
  notifications: Notification[];
  unreadCount: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onMarkRead?: (id: string) => Promise<void>;
  onMarkAllRead?: () => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onSelect?: (notification: Notification) => void;
}

export function NotificationDrawer({
  notifications,
  unreadCount,
  open,
  onOpenChange,
  trigger,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onSelect,
}: NotificationDrawerProps) {
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const startX = touch.clientX;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      if (!moveTouch) return;
      const currentX = moveTouch.clientX;
      const diffX = startX - currentX;

      if (diffX > 40) {
        setSwipedId(id);
      } else if (diffX < -40) {
        setSwipedId(null);
      }
    };

    const handleTouchEnd = () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <Drawer
      title="Notifications"
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
    >
      <div className="space-y-3 pt-2">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <span className="text-xs font-semibold text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All notifications"}
          </span>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400"
              onClick={() => onMarkAllRead()}
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground">You are all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const isSwiped = swipedId === notification.id;

              return (
                <div
                  key={notification.id}
                  className="relative overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900"
                  onTouchStart={(e) => handleTouchStart(notification.id, e)}
                >
                  {/* Swipe Action Background Layer */}
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 bg-slate-100 px-2 dark:bg-slate-800">
                    {!notification.isRead && onMarkRead && (
                      <button
                        onClick={() => onMarkRead(notification.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs hover:bg-amber-600"
                        aria-label="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(notification.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow-xs hover:bg-red-600"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Main Item Content Card */}
                  <div
                    onClick={() => onSelect?.(notification)}
                    className={`relative z-10 flex cursor-pointer items-start gap-3 bg-white p-3.5 transition-transform dark:bg-slate-900 ${
                      isSwiped ? "-translate-x-24" : "translate-x-0"
                    } ${!notification.isRead ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <span className="inline-block text-[10px] text-slate-400">
                        {new Date(notification.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
