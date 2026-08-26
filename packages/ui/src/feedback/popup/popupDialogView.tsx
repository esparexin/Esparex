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
  const titleMatchesMessage =
    active.title.trim().toLowerCase() === active.message.trim().toLowerCase();

  return (
    <RadixDialog.Root
      open={active.open}
      onOpenChange={(open) => !open && onClose()}
      modal={true}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[12000] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" />
        <RadixDialog.Content
          className={joinClasses(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[12010] w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200 outline-none",
            config.cardClass
          )}
          onInteractOutside={() => onClose()}
        >
          <div className="flex items-start gap-3.5" role="status" aria-live={active.type === "error" ? "assertive" : "polite"}>
            <div
              className={joinClasses(
                "mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                config.iconWrapClass
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className={joinClasses("text-body-lg font-bold leading-tight", config.titleClass)}>
                {active.title}
                {active.count && active.count > 1 ? ` (x${active.count})` : ""}
              </RadixDialog.Title>
              {!titleMatchesMessage ? (
                <RadixDialog.Description className="mt-1.5 text-body text-foreground-secondary leading-relaxed">
                  {active.message}
                </RadixDialog.Description>
              ) : null}
              {countdown !== null && countdown > 0 ? (
                <p className="mt-2 text-caption font-medium text-foreground-subtle">You may retry in {countdown}s</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-subtle transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 pt-3 flex flex-wrap justify-end gap-2 border-t border-border/60">
            {showActions ? (
              actions.map((action, index) => {
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
                      "rounded-xl px-4 py-2 text-caption font-semibold transition-colors",
                      isThrottled
                        ? "cursor-not-allowed bg-muted text-foreground-subtle"
                        : index === 0
                          ? config.buttonClass
                          : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    {isThrottled ? `Retry in ${countdown}s` : action.label}
                  </button>
                );
              })
            ) : (
              <button
                type="button"
                onClick={onClose}
                className={joinClasses(
                  "rounded-xl px-4 py-2 text-caption font-semibold transition-colors shadow-xs",
                  config.buttonClass
                )}
              >
                Got it
              </button>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
