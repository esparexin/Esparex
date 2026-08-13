"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Trash2, Inbox } from "@/icons/IconRegistry";
import { type Notification } from "@/lib/api/user/notifications";

import {
  Button,
  Drawer,
} from "@esparex/ui";

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
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All notifications"}
          </span>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-medium text-primary hover:bg-muted"
              onClick={() => onMarkAllRead()}
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/50 p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-sm">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground">You are all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const isSwiped = swipedId === notification.id;
              const titleId = `notif-title-${notification.id}`;
              const descId = `notif-desc-${notification.id}`;
              const dateId = `notif-date-${notification.id}`;

              return (
                <div
                  key={notification.id}
                  className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all"
                  onTouchStart={(e) => handleTouchStart(notification.id, e)}
                >
                  {/* Swipe Action Background Layer */}
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 bg-muted px-2">
                    {!notification.isRead && onMarkRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void onMarkRead(notification.id);
                          setSwipedId(null);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        aria-label={`Mark notification as read: ${notification.title}`}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void onDelete(notification.id);
                          setSwipedId(null);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/20"
                        aria-label={`Delete notification: ${notification.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Main Item Content Card */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelect?.(notification);
                      setSwipedId(null);
                    }}
                    aria-labelledby={titleId}
                    aria-describedby={`${descId} ${dateId}`}
                    className={`relative z-10 flex w-full text-left cursor-pointer items-start gap-3 bg-card p-3.5 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1 ${
                      isSwiped ? "-translate-x-24" : "translate-x-0"
                    } ${!notification.isRead ? "bg-accent/40" : ""}`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground-secondary">
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p id={titleId} className="text-xs font-semibold text-foreground truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread notification" />
                        )}
                      </div>
                      <p id={descId} className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <span id={dateId} className="inline-block text-tiny text-foreground-subtle">
                        {new Date(notification.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
