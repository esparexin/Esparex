"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

const DRAG_CLOSE_THRESHOLD = 60; // px displacement
const VELOCITY_THRESHOLD = 0.4; // px/ms

export function AuthModal({ open, onOpenChange, callbackUrl }: AuthModalProps) {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset drag state when modal closes/opens
  useEffect(() => {
    if (!open) {
      setDragOffsetY(0);
      setIsDragging(false);
      touchStartYRef.current = null;
    }
  }, [open]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0]?.clientY;
    if (typeof currentY !== "number") return;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0) {
      // Downward drag - apply real-time translation
      setDragOffsetY(diff);
    } else {
      setDragOffsetY(0);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartYRef.current === null) return;
    const elapsed = Date.now() - touchStartTimeRef.current;
    const velocity = dragOffsetY / Math.max(1, elapsed);

    if (dragOffsetY >= DRAG_CLOSE_THRESHOLD || (dragOffsetY > 25 && velocity > VELOCITY_THRESHOLD)) {
      // Drag threshold met — dismiss drawer
      onOpenChange(false);
    }

    // Snap back
    setIsDragging(false);
    setDragOffsetY(0);
    touchStartYRef.current = null;
  }, [dragOffsetY, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        hideClose
        variant="bottomSheet"
        onOpenAutoFocus={(e) => {
          // Prevent Radix default autofocus jump before slide-in animation settles
          e.preventDefault();
        }}
        /* design-token-ignore: dynamic drag gesture translation */
        style={{
          transform: dragOffsetY > 0 ? `translate3d(0, ${dragOffsetY}px, 0)` : undefined,
          transition: isDragging ? "none" : undefined,
        }}
        className={cn(
          "max-w-none sm:max-w-sm md:max-w-sm h-auto sm:min-h-[480px] p-4 pb-5 sm:p-6 overflow-y-auto overscroll-contain bg-card border-none sm:border sm:border-border/80 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col justify-between"
        )}
      >
        {/* Mobile Drawer Interactive Drag Handle Zone */}
        <div
          className="mx-auto -mt-2 mb-2 py-2.5 px-6 flex items-center justify-center cursor-grab active:cursor-grabbing sm:hidden touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          aria-label="Drag down to close drawer"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === "Escape") {
              onOpenChange(false);
            }
          }}
        >
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
        </div>

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
        
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <LoginFlow mode="modal" callbackUrl={callbackUrl} onClose={() => onOpenChange(false)} onBack={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
