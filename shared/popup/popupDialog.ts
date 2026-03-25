import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import type { PopupAction, PopupState } from "./popupCore";

export type RenderablePopup = PopupState & { count?: number };

export const popupTypeConfig = {
  error: {
    icon: AlertTriangle,
    titleClass: "text-red-900",
    cardClass: "border-red-200 bg-red-50 text-red-900",
    buttonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: TriangleAlert,
    titleClass: "text-amber-900",
    cardClass: "border-amber-200 bg-amber-50 text-amber-900",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    icon: Info,
    titleClass: "text-blue-900",
    cardClass: "border-blue-200 bg-blue-50 text-blue-900",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  success: {
    icon: CheckCircle2,
    titleClass: "text-emerald-900",
    cardClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  confirm: {
    icon: AlertTriangle,
    titleClass: "text-slate-900",
    cardClass: "border-slate-200 bg-white text-slate-900",
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
    () =>
      active?.actions && active.actions.length > 0
        ? active.actions
        : [{ label: "Dismiss", action: onClose }],
    [active?.actions, onClose]
  );

  return {
    active,
    actions,
    countdown,
  };
}
