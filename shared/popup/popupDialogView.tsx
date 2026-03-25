"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { popupTypeConfig, type RenderablePopup, usePopupDialogState } from "./popupDialog";

function joinClasses(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function PopupDialogView({
  popup,
  onClose,
}: {
  popup: RenderablePopup | null;
  onClose: () => void;
}) {
  const { active, actions, countdown } = usePopupDialogState(popup, onClose);

  if (!active) return null;

  const config = popupTypeConfig[active.type];
  const Icon = config.icon;

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
          className={joinClasses(
            "fixed z-[12010] w-[calc(100vw-1.5rem)] max-w-md rounded-xl border shadow-2xl outline-none",
            active.type === "confirm"
              ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-6"
              : "right-3 top-3 p-4 sm:right-5 sm:top-5",
            config.cardClass
          )}
          onInteractOutside={(event) => {
            if (active.type !== "confirm") {
              event.preventDefault();
            }
          }}
        >
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className={joinClasses("text-base font-semibold", config.titleClass)}>
                {active.title}
                {active.count && active.count > 1 ? ` (x${active.count})` : ""}
              </RadixDialog.Title>
              <RadixDialog.Description className="mt-1 text-sm opacity-90">
                {active.message}
              </RadixDialog.Description>
              {countdown !== null && countdown > 0 ? (
                <p className="mt-1 text-xs opacity-60">You may retry in {countdown}s</p>
              ) : null}
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
                  className={joinClasses(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isThrottled
                      ? "cursor-not-allowed bg-white/40 text-slate-400"
                      : index === 0
                        ? config.buttonClass
                        : "bg-white/80 text-slate-700 hover:bg-white"
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
