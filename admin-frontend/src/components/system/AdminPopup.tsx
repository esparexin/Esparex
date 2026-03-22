"use client";

import { useEffect, useState } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { AlertTriangle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import type { PopupState } from "@/lib/popup/popupEvents";

type RenderablePopup = PopupState & { count?: number };

const typeConfig = {
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

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function AdminPopup({
  popup,
  onClose,
}: {
  popup: RenderablePopup | null;
  onClose: () => void;
}) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.retryAfter]);

  if (!active) return null;

  const config = typeConfig[active.type];
  const Icon = config.icon;
  const actions =
    active.actions && active.actions.length > 0
      ? active.actions
      : [{ label: "Dismiss", action: onClose }];

  return (
    <RadixDialog.Root
      open={active.open}
      onOpenChange={(open) => !open && onClose()}
      modal={active.type === "confirm"}
    >
      <RadixDialog.Portal>
        {active.type === "confirm" ? (
          <RadixDialog.Overlay className="fixed inset-0 z-[12000] bg-black/50 backdrop-blur-[2px]" />
        ) : null}
        <RadixDialog.Content
          className={cn(
            "fixed z-[12010] w-[calc(100vw-1.5rem)] max-w-md rounded-xl border shadow-2xl outline-none",
            active.type === "confirm"
              ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-6"
              : "right-3 top-3 p-4 sm:right-5 sm:top-5",
            config.cardClass,
          )}
          onInteractOutside={(event) => {
            if (active.type !== "confirm") event.preventDefault();
          }}
        >
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className={cn("text-base font-semibold", config.titleClass)}>
                {active.title}
                {active.count && active.count > 1 ? ` (x${active.count})` : ""}
              </RadixDialog.Title>
              <RadixDialog.Description className="mt-1 text-sm opacity-90">
                {active.message}
              </RadixDialog.Description>
              {countdown !== null && countdown > 0 && (
                <p className="mt-1 text-xs opacity-60">
                  You may retry in {countdown}s
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {actions.map((action, index) => {
              const isThrottled = action.isRetry && countdown !== null && countdown > 0;
              return (
                <button
                  key={`${action.label}-${index}`}
                  type="button"
                  disabled={isThrottled}
                  onClick={() => {
                    if (isThrottled) return;
                    action.action?.();
                    onClose();
                  }}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isThrottled
                      ? "cursor-not-allowed bg-white/40 text-slate-400"
                      : index === 0
                        ? config.buttonClass
                        : "bg-white/80 text-slate-700 hover:bg-white",
                  )}
                >
                  {isThrottled ? `Retry in ${countdown}s` : action.label}
                </button>
              );
            })}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
