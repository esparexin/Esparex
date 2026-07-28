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
import { Z_INDEX } from "@esparex/ui";
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
        style={{ zIndex: Z_INDEX.authModalContent }}
        className={cn(
          // Mobile (default): Full screen, no borders, bg gradient, safe area padding
          "fixed inset-0 w-full h-[100dvh] max-w-none max-h-none border-0 rounded-none p-0 outline-none overflow-y-auto flex flex-col",
          "bg-white",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          // Desktop (sm+): Centered modal, max-w-[420px], reduced width, taller with more padding
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-[420px] sm:h-auto sm:border sm:rounded-2xl sm:bg-white sm:bg-none sm:shadow-2xl sm:px-12 sm:py-16",
          // Animations: 
          "duration-300 sm:duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          // Mobile animation: slide up from bottom
          "data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full",
          // Desktop animation: disable slide, use zoom/fade instead
          "sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
          "sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0",
          "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95"
        )}
      >
        {/* Accessible Title & Description for Screen Readers */}
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <DialogDescription className="sr-only">Sign in or create an account.</DialogDescription>
        
        {/* Close Button */}
        <DialogClose
          className={cn(
            "absolute z-50 flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none",
            // Mobile positioning
            "right-4 top-[calc(env(safe-area-inset-top)+1rem)] bg-black/5 hover:bg-black/10 text-slate-700",
            // Desktop positioning
            "sm:right-4 sm:top-4 sm:bg-slate-100 sm:hover:bg-slate-200 sm:opacity-70 sm:hover:opacity-100"
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </DialogClose>
        
        <div className="flex-1 flex flex-col justify-center my-auto min-h-0 sm:min-h-0 sm:justify-start sm:my-0 px-8 sm:px-0">
          <LoginFlow mode="modal" callbackUrl={callbackUrl} onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
