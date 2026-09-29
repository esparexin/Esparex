"use client";

import { useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose, X, ArrowLeft } from "@esparex/ui";
import { cn } from "@/lib/utils";
import { LoginFlow } from "@/components/auth/LoginFlow";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string | null;
}

export function AuthModal({ open, onOpenChange, callbackUrl }: AuthModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const backActionRef = useRef<(() => void) | null>(null);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  const handleBack = useCallback(() => {
    if (backActionRef.current) backActionRef.current();
    else handleOpenChange(false);
  }, [handleOpenChange]);

  const registerBackAction = useCallback((action: (() => void) | null) => {
    backActionRef.current = action;
  }, []);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        ref={contentRef}
        side="bottom"
        hideClose
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          // responsive-exception: autofocus gated on viewport to avoid mobile keyboard jank (dynamic behavior).
          if (typeof window !== "undefined" && window.innerWidth >= 640) {
            document.querySelector<HTMLInputElement>('input[name="mobile"]')?.focus({ preventScroll: true });
          }
        }}
        className={cn(
          "inset-0 h-full w-full max-w-none border-none rounded-none bg-card shadow-2xl flex flex-col justify-between overflow-y-auto overscroll-contain",
          "p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          "sm:max-w-sm sm:h-fit sm:min-h-[480px] sm:max-h-[calc(100dvh-3rem)] sm:m-auto sm:p-6 sm:rounded-2xl sm:border sm:border-border/80",
          "sm:inset-0 sm:animate-none sm:transition-none sm:transform-none"
        )}
      >
        <SheetTitle className="sr-only">Authentication</SheetTitle>
        <SheetDescription className="sr-only">Sign in or create an account.</SheetDescription>

        {/* Top Navigation Bar: Clear and Consistent Back and Close buttons */}
        <div className="flex items-center justify-between w-full shrink-0 mb-2 sm:mb-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>

          <SheetClose
            className="flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </SheetClose>
        </div>

        <div className="flex-1 flex flex-col justify-between min-h-0">
          <LoginFlow
            mode="modal"
            callbackUrl={callbackUrl}
            onClose={() => handleOpenChange(false)}
            onBack={() => handleOpenChange(false)}
            onRegisterBackAction={registerBackAction}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}