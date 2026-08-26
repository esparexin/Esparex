"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";

import type { PopupAction, PopupState, PopupType } from "@esparex/shared";

export type RenderablePopup = PopupState & { count?: number };

export type PopupStyleConfig = {
  icon: LucideIcon;
  titleClass: string;
  cardClass: string;
  iconWrapClass: string;
  buttonClass: string;
};

export const popupTypeConfig: Record<PopupType, PopupStyleConfig> = {
  error: {
    icon: AlertTriangle,
    titleClass: "text-foreground font-bold",
    cardClass: "border-border bg-card text-foreground",
    iconWrapClass: "bg-destructive/10 text-destructive border border-destructive/20",
    buttonClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
  },
  warning: {
    icon: TriangleAlert,
    titleClass: "text-foreground font-bold",
    cardClass: "border-border bg-card text-foreground",
    iconWrapClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    icon: Info,
    titleClass: "text-foreground font-bold",
    cardClass: "border-border bg-card text-foreground",
    iconWrapClass: "bg-primary/10 text-primary border border-primary/20",
    buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
  success: {
    icon: CheckCircle2,
    titleClass: "text-foreground font-bold",
    cardClass: "border-border bg-card text-foreground",
    iconWrapClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  confirm: {
    icon: AlertTriangle,
    titleClass: "text-foreground font-bold",
    cardClass: "border-border bg-card text-foreground",
    iconWrapClass: "bg-muted text-foreground-secondary border border-border",
    buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
};

export function usePopupDialogState(
  popup: RenderablePopup | null,
  onClose: () => void
) {
  const active = popup?.open ? popup : null;

  useEffect(() => {
    if (!active) return;
    if (active.type !== "success" && active.type !== "info") return;

    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [active, onClose]);

  const [countdown, setCountdown] = useState<number | null>(() => active?.retryAfter ?? null);

  useEffect(() => {
    if (!active?.retryAfter) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [active?.id, active?.retryAfter]);

  const actions: PopupAction[] = active?.actions && active.actions.length > 0
    ? active.actions
    : active?.type === "confirm"
      ? [
        { label: "Confirm" },
        { label: "Cancel", action: onClose },
      ]
      : [];

  return {
    active,
    actions,
    countdown,
  };
}
