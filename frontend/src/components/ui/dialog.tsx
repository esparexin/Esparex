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
import { cn } from "./utils";

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
    className={cn(
      // Radix injects data-[state] so we can animate in/out with tailwindcss-animate
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
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
  }
>(({ className, children, hideClose = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        // Positioning — centred, fills up to 90vh
        "fixed left-[50%] top-[50%] z-50",
        "translate-x-[-50%] translate-y-[-50%]",
        "w-full max-w-lg mx-4",
        // Appearance — matches the previous custom dialog exactly
        "bg-white rounded-lg shadow-lg p-6",
        "max-h-[90vh] overflow-y-auto",
        // Entry / exit animations via tailwindcss-animate
        "duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <RadixDialog.Close
          className={cn(
            "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background",
            "transition-opacity hover:opacity-100",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
));
DialogContent.displayName = "DialogContent";

// ── Header ───────────────────────────────────────────────────────────────────
function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col space-y-1.5",
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
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
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
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
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
