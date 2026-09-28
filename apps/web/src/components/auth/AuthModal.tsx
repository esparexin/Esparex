"use client";

import { useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose, X, ArrowLeft } from "@esparex/ui";
import { cn } from "@/lib/utils";
import { LoginFlow } from "@/components/auth/LoginFlow";
import { useDrawerDragGesture } from "@/hooks/useDrawerDragGesture";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string | null;
}

export function AuthModal({ open, onOpenChange, callbackUrl }: AuthModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const backActionRef = useRef<(() => void) | null>(null);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) resetDrag();
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  const { dragOffsetY, isDragging, resetDrag, touchHandlers } = useDrawerDragGesture(() => handleOpenChange(false));

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
        /* design-token-ignore: dynamic drag gesture translation */
        style={{
          transform: dragOffsetY > 0 ? `translate3d(0, ${dragOffsetY}px, 0)` : undefined,
          transition: isDragging ? "none" : undefined,
        }}
        className={cn(
          "max-w-none sm:max-w-sm md:max-w-sm h-auto sm:h-fit sm:min-h-[480px] sm:max-h-[calc(100dvh-3rem)] sm:inset-0 sm:m-auto p-4 pb-5 sm:p-6 overflow-y-auto overscroll-contain bg-card border-none sm:border sm:border-border/80 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col justify-between",
          "sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:fade-in-0 sm:duration-200"
        )}
      >
        {/* Mobile Drawer Interactive Drag Handle Zone */}
        <div
          className="mx-auto -mt-2 mb-2 py-2.5 px-6 flex items-center justify-center cursor-grab active:cursor-grabbing sm:hidden touch-none select-none"
          {...touchHandlers}
          role="button"
          tabIndex={0}
          aria-label="Drag down to close drawer"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === "Escape") handleOpenChange(false);
          }}
        >
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
        </div>

        <SheetTitle className="sr-only">Authentication</SheetTitle>
        <SheetDescription className="sr-only">Sign in or create an account.</SheetDescription>

        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-3.5 top-3.5 sm:top-4 sm:left-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-foreground-secondary hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Close Button */}
        <SheetClose
          className="absolute right-3.5 top-3.5 sm:top-4 sm:right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-foreground-secondary hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </SheetClose>
        
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