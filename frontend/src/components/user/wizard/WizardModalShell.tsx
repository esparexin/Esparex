"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as RadixDialog from "@radix-ui/react-dialog";

interface WizardModalShellProps {
  title: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  headerContent?: ReactNode;
  className?: string;
}

export function WizardModalShell({
  title,
  description,
  currentStep,
  totalSteps,
  onClose,
  children,
  footer,
  headerContent,
  className,
}: WizardModalShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [currentStep]);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <RadixDialog.Content
          className={cn(
            "fixed z-[301] left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full flex flex-col overflow-hidden bg-background shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200",
            "h-[100dvh] sm:h-[92vh] sm:rounded-t-2xl md:h-auto md:max-h-[88vh] md:max-w-2xl md:rounded-2xl",
            className
          )}
        >
          <RadixDialog.Title className="sr-only">{title || "Post Ad Wizard"}</RadixDialog.Title>
          <RadixDialog.Description className="sr-only">
            {description ?? "Complete the form steps in this dialog before closing or submitting."}
          </RadixDialog.Description>
          <div className="sticky top-0 z-20 border-b border-border bg-white px-4 py-4 sm:px-5">
            <div className="pr-12 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {headerContent}
                  <h2 className="text-sm font-bold text-foreground sm:text-base">
                    {title}
                  </h2>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors duration-200",
                      index + 1 <= currentStep ? "bg-blue-600" : "bg-slate-100"
                    )}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground-secondary transition-colors hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8"
          >
            {children}
          </div>

          <div className="flex-none border-t border-border bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </div>
        </RadixDialog.Content>
      </DialogPortal>
    </Dialog>
  );
}
