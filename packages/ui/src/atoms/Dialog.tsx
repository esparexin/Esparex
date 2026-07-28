"use client";

/**
 * dialog.tsx — Unified Dialog System (Radix UI)
 *
 * PR-1: Modal System Unification
 *
 * Replaces the previous custom dialog implementation with @radix-ui/react-dialog
 * primitives. This gives us:
 *   ✅ role="dialog" + aria-modal="true"      (automatic via Radix)
 *   ✅ Focus trapping while modal is open      (automatic via Radix)
 *   ✅ Escape key closes modal                 (automatic via Radix)
 *   ✅ Overlay click closes modal              (automatic via Radix)
 *   ✅ Scroll locking                          (automatic via Radix)
 *   ✅ Focus returns to trigger on close       (automatic via Radix)
 *   ✅ Smooth entry/exit animations            (tailwindcss-animate)
 *
 * Export API is identical to the previous custom implementation — all consumers
 * (NavigationContext, BoostPlanDialog, CommandDialog, profile dialogs) require
 * ZERO import changes.
 */

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../utils";
import { Z_INDEX } from "../tokens/zIndex";

// ── Root ────────────────────────────────────────────────────────────────────
const Dialog = RadixDialog.Root;
Dialog.displayName = "Dialog";

// ── Trigger ─────────────────────────────────────────────────────────────────
const DialogTrigger = RadixDialog.Trigger;
DialogTrigger.displayName = "DialogTrigger";

// ── Portal ───────────────────────────────────────────────────────────────────
const DialogPortal = RadixDialog.Portal;
DialogPortal.displayName = "DialogPortal";

// ── Close ────────────────────────────────────────────────────────────────────
const DialogClose = RadixDialog.Close;
DialogClose.displayName = "DialogClose";

// ── Overlay ──────────────────────────────────────────────────────────────────
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(({ className, ...props }, ref) => (
  <RadixDialog.Overlay
    ref={ref}
    style={{ zIndex: Z_INDEX.dialogOverlay }}
    className={cn(
      // Radix injects data-[state] so we can animate in/out with tailwindcss-animate
      "fixed inset-0 bg-black/20 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

// ── Content ──────────────────────────────────────────────────────────────────
const DialogContent = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
    /** When true, hides the default close (×) button in the top-right corner. */
    hideClose?: boolean;
    /** When true, uses a mobile keyboard-safe top anchored layout. */
    mobileSafe?: boolean;
    /** Layout positioning variant: 'centered' (default), 'bottomSheet', 'mobileSafe', or 'fullscreen'. */
    variant?: "centered" | "bottomSheet" | "mobileSafe" | "fullscreen";
    /** Custom z-index for the background overlay backdrop. */
    overlayZIndex?: number;
    /** Custom class names for the background overlay backdrop. */
    overlayClassName?: string;
  }
>(({ className, children, hideClose = false, mobileSafe = false, variant, overlayZIndex, overlayClassName, ...props }, ref) => {
  const activeVariant = variant ?? (mobileSafe ? "mobileSafe" : "centered");

  /**
   * TRANSFORM SAFETY RULE (MANDATORY):
   * Every DialogContent variant must completely own its positioning contract.
   * A variant specifying layout coordinates (top, left, bottom, right) MUST explicitly specify
   * its transform state (translate-x, translate-y) to prevent inherited transform state leakage.
   */
  const getVariantStyles = () => {
    switch (activeVariant) {
      case "fullscreen":
        return [
          "fixed inset-0 w-full h-[100dvh] max-w-none max-h-none translate-x-0 translate-y-0 rounded-none border-none bg-white p-0 flex flex-col overflow-hidden shadow-none",
          "duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        ];
      case "bottomSheet":
        return [
          "fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 w-full max-w-none h-auto max-h-[92dvh] rounded-t-2xl border-none p-0 bg-white flex flex-col overflow-hidden shadow-2xl",
          "sm:fixed sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:right-auto sm:translate-x-[-50%] sm:translate-y-[-50%]",
          "sm:w-full sm:max-w-md md:max-w-[540px] sm:h-auto sm:max-h-[calc(100dvh-3rem)]",
          "sm:rounded-2xl sm:shadow-2xl sm:shadow-slate-900/15 sm:border sm:border-slate-200/80",
          "duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
          "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
        ];
      case "mobileSafe":
        return [
          "fixed left-[50%] top-4 bottom-auto right-auto w-[calc(100vw-2rem)] max-w-lg outline-none -translate-x-1/2 translate-y-0 sm:top-[50%] sm:-translate-y-1/2",
          "flex h-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-lg",
          "duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
        ];
      case "centered":
      default:
        return [
          "fixed left-[50%] top-[50%] bottom-auto right-auto translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] max-w-lg mx-auto",
          "bg-white rounded-2xl shadow-xl p-5 max-h-[calc(100dvh-2rem)] overflow-y-auto border border-slate-200/80",
          "duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        ];
    }
  };

  return (
    <DialogPortal>
      <DialogOverlay style={{ zIndex: overlayZIndex ?? Z_INDEX.dialogOverlay }} className={overlayClassName} />
      <RadixDialog.Content
        ref={ref}
        style={{ zIndex: Z_INDEX.dialogContent }}
        className={cn(getVariantStyles(), className)}
        {...props}
      >
      {children}
      {!hideClose && (
        <RadixDialog.Close
          className={cn(
            "absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-sm opacity-70 ring-offset-background",
            "transition-opacity hover:opacity-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none",
            "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </RadixDialog.Close>
      )}
    </RadixDialog.Content>
  </DialogPortal>
  );
});
DialogContent.displayName = "DialogContent";

// ── Header ───────────────────────────────────────────────────────────────────
function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-col space-y-1.5",
        className
      )}
      {...props}
    />
  );
}
DialogHeader.displayName = "DialogHeader";

// ── Footer ───────────────────────────────────────────────────────────────────
function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4",
        className
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = "DialogFooter";

// ── Title ────────────────────────────────────────────────────────────────────
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(({ className, ...props }, ref) => (
  <RadixDialog.Title
    ref={ref}
    className={cn("text-h3 font-semibold leading-snug tracking-tight text-slate-900", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

// ── Description ──────────────────────────────────────────────────────────────
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(({ className, ...props }, ref) => (
  <RadixDialog.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

/**
 * Dialog Z-Index Reference
 * - DialogOverlay uses Z_INDEX.dialogOverlay (300)
 * - DialogContent uses Z_INDEX.dialogContent (301)
 * See /src/lib/zIndexConfig.ts for centralized z-index management
 */
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
