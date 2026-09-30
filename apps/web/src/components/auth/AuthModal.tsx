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
          // Mobile: full-viewport opaque modal surface eliminating background bleed.
          "top-0 bottom-0 left-0 right-0 h-full max-h-none w-full max-w-none border-none rounded-none bg-card shadow-2xl flex flex-col overflow-hidden",
          "p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-0",
          "sm:inset-0 sm:m-auto sm:w-full sm:max-w-sm sm:h-fit sm:min-h-[480px] sm:max-h-[calc(100dvh-3rem)] sm:p-6 sm:pb-6 sm:rounded-2xl sm:border sm:border-border/80 sm:shadow-2xl",
          "sm:animate-none sm:transition-none sm:transform-none sm:overflow-hidden"
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

        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain -mx-4 px-4 sm:-mx-6 sm:px-6">
          <LoginFlow
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