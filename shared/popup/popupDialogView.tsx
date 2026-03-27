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
  const showActions = actions.length > 0;
  const isConfirm = active.type === "confirm";
  const titleMatchesMessage =
    active.title.trim().toLowerCase() === active.message.trim().toLowerCase();

  return (
    <RadixDialog.Root
      open={active.open}
      onOpenChange={(open) => !open && onClose()}
      modal={isConfirm}
    >
      <RadixDialog.Portal>
        {isConfirm ? (
          <RadixDialog.Overlay className="fixed inset-0 z-[12000] bg-black/50 backdrop-blur-[2px]" />
        ) : null}
        <RadixDialog.Content
          className={joinClasses(
            "fixed z-[12010] overflow-hidden outline-none",
            isConfirm
              ? "left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-2xl"
              : "right-3 top-3 w-[calc(100vw-1rem)] max-w-[22rem] rounded-2xl border shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:right-5 sm:top-5",
            config.cardClass
          )}
          onInteractOutside={(event) => {
            if (!isConfirm) {
              event.preventDefault();
            }
          }}
        >
          <div className={joinClasses("flex items-start gap-3", isConfirm ? "" : "p-4")}>
            <div
              className={joinClasses(
                "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                config.iconWrapClass
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className={joinClasses("text-sm font-semibold leading-5", config.titleClass)}>
                {active.title}
                {active.count && active.count > 1 ? ` (x${active.count})` : ""}
              </RadixDialog.Title>
              {!titleMatchesMessage ? (
                <RadixDialog.Description className="mt-1 text-sm leading-5 text-slate-600">
                  {active.message}
                </RadixDialog.Description>
              ) : null}
              {countdown !== null && countdown > 0 ? (
                <p className="mt-2 text-xs font-medium text-slate-500">You may retry in {countdown}s</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {showActions ? (
            <div className={joinClasses("flex flex-wrap justify-end gap-2 border-t border-black/5", isConfirm ? "mt-5 pt-4" : "px-4 pb-4 pt-3")}>
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
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isThrottled
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : index === 0
                          ? config.buttonClass
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {isThrottled ? `Retry in ${countdown}s` : action.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
