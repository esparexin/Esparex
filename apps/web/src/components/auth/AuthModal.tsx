"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { LoginFlow } from "@/components/auth/LoginFlow";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string | null;
}

export function AuthModal({ open, onOpenChange, callbackUrl }: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className={cn(
          // Responsive Centered Dialog Card (Mobile & Desktop):
          // Fits within viewport bounds with backdrop blur, rounded corners, and shadow
          "fixed left-1/2 top-4 sm:top-1/2 -translate-x-1/2 translate-y-0 sm:-translate-y-1/2 w-[calc(100vw-2rem)] sm:w-full max-w-sm h-auto max-h-[min(100%,calc(var(--visual-viewport-height,100dvh)-2rem))] border border-border rounded-2xl sm:rounded-3xl bg-background shadow-xl p-5 sm:p-6 overflow-y-auto outline-none flex flex-col justify-center",
          // Smooth zoom & fade animations:
          "duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
      >
        {/* Accessible Title & Description for Screen Readers */}
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <DialogDescription className="sr-only">Sign in or create an account.</DialogDescription>
        
        {/* Close Button */}
        <DialogClose
          className={cn(
            "absolute right-3.5 top-3.5 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </DialogClose>
        
        <div className="flex-1 flex flex-col justify-center my-auto min-h-0">
          <LoginFlow mode="modal" callbackUrl={callbackUrl} onClose={() => onOpenChange(false)} onBack={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
