"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@esparex/ui";
import { X } from "@esparex/ui";
import { cn } from "@/lib/utils";
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
        variant="bottomSheet"
        className={cn(
          "max-w-none sm:max-w-sm h-auto p-5 sm:p-6 overflow-y-auto overscroll-contain bg-card border-none sm:border sm:border-border/80 rounded-t-3xl sm:rounded-2xl shadow-2xl"
        )}
      >
        {/* Mobile Drawer Drag Handle Notch */}
        <div className="mx-auto -mt-1 mb-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/25 sm:hidden" />

        {/* Accessible Title & Description for Screen Readers */}
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <DialogDescription className="sr-only">Sign in or create an account.</DialogDescription>
        
        {/* Close Button */}
        <DialogClose
          className={cn(
            "absolute right-3.5 top-3.5 sm:top-4 sm:right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-foreground-secondary hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
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
