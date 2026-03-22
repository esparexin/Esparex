"use client";

import * as React from "react";

/**
 * Minimal dialog primitives used by RejectAdModal and ViewAdModal.
 * These are lightweight wrappers — not a full Radix/shadcn installation.
 */

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      {children}
    </div>
  );
}

export function DialogContent({ children, className = "", hideClose: _hideClose }: { children: React.ReactNode; className?: string; hideClose?: boolean }) {
  return (
    <div
      className={`relative z-50 mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-bold text-slate-900 ${className}`}>{children}</h2>;
}

export function DialogDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-slate-500 ${className}`}>{children}</p>;
}

export function DialogFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-6 flex justify-end gap-3 ${className}`}>{children}</div>;
}
