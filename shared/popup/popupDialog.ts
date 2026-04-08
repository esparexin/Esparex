import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import type { PopupAction, PopupState } from "./popupCore";

export type RenderablePopup = PopupState & { count?: number };

export const popupTypeConfig = {
  error: {
    icon: AlertTriangle,
    titleClass: "text-rose-950",
    cardClass:
      "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-rose-500 border-rose-200/80 bg-white/95 text-slate-800 backdrop-blur-sm",
    iconWrapClass: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
    buttonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: TriangleAlert,
    titleClass: "text-amber-950",
    cardClass:
      "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-amber-500 border-amber-200/80 bg-white/95 text-slate-800 backdrop-blur-sm",
    iconWrapClass: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    icon: Info,
    titleClass: "text-sky-950",
    cardClass:
      "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-sky-500 border-sky-200/80 bg-white/95 text-slate-800 backdrop-blur-sm",
    iconWrapClass: "bg-sky-50 text-sky-600 ring-1 ring-sky-100",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  success: {
    icon: CheckCircle2,
    titleClass: "text-emerald-950",
    cardClass:
      "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-emerald-500 border-emerald-200/80 bg-white/95 text-slate-800 backdrop-blur-sm",
    iconWrapClass: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  confirm: {
    icon: AlertTriangle,
    titleClass: "text-slate-900",
    cardClass: "border-slate-200 bg-white text-slate-900",
    iconWrapClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    buttonClass: "bg-slate-900 hover:bg-slate-800 text-white",
  },
} as const;

export function usePopupDialogState(
  popup: RenderablePopup | null,
  onClose: () => void
) {
  const active = popup?.open ? popup : null;

  useEffect(() => {
    if (!active) return;
    if (active.type !== "success" && active.type !== "info") return;

    const timer = window.setTimeout(() => onClose(), 4000);
    return () => window.clearTimeout(timer);
  }, [active, onClose]);

  const [countdown, setCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (!active?.retryAfter) {
      setCountdown(null);
      return;
    }

    setCountdown(active.retryAfter);
    const interval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [active?.id, active?.retryAfter]);

  const actions = useMemo<PopupAction[]>(
    () => {
      if (active?.actions && active.actions.length > 0) {
        return active.actions;
      }

      if (active?.type === "confirm") {
        return [
          { label: "Confirm" },
          { label: "Cancel", action: onClose },
        ];
      }

      return [];
    },
    [active?.actions, active?.type, onClose]
  );

  return {
    active,
    actions,
    countdown,
  };
}
