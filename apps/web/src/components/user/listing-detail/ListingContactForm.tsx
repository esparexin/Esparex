"use client";

import { MessageCircle, Phone, MessageSquareOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

export interface ListingContactFormProps {
  onChat?: () => void;
  onRevealPhone?: () => void;
  isPhoneLoading?: boolean;
  revealedPhone?: string | null;
  phoneMessage?: string | null;
  isChatLocked?: boolean;
  layout?: "grid" | "flex";
  buttonClassName?: string;
}

export function ListingContactForm({
  onChat,
  onRevealPhone,
  isPhoneLoading = false,
  revealedPhone,
  phoneMessage,
  isChatLocked = false,
  layout = "grid",
  buttonClassName,
}: ListingContactFormProps) {
  const showPhoneAction = Boolean(onRevealPhone);
  const showChatAction = Boolean(onChat) && !isChatLocked;
  const hasActions = showPhoneAction || showChatAction;

  const phoneButtonLabel = isPhoneLoading
    ? "Loading..."
    : (revealedPhone || "Show number");

  if (isChatLocked && !showPhoneAction) {
    return (
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
          <MessageSquareOff className="h-4 w-4 text-foreground-subtle" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground-tertiary">Chat Locked</p>
          <p className="text-2xs text-foreground-subtle mt-0.5">This listing is no longer accepting new messages.</p>
        </div>
      </div>
    );
  }

  if (!hasActions) {
    return null;
  }

  const containerClass = layout === "grid"
    ? cn("grid gap-2", showChatAction && showPhoneAction ? "grid-cols-2" : "grid-cols-1")
    : "flex items-center gap-2 w-full";

  return (
    <div className="space-y-2.5 w-full">
      <div className={containerClass}>
        {showPhoneAction && (
          <Button
            onClick={onRevealPhone}
            variant="outline"
            disabled={isPhoneLoading}
            aria-label={revealedPhone ? `Call ${revealedPhone}` : "Reveal seller phone number"}
            className={cn(
              "h-11 rounded-xl font-semibold gap-2 border-slate-200 text-foreground-secondary hover:bg-slate-50",
              layout === "flex" ? "flex-1 h-12 rounded-2xl font-bold" : "w-full",
              buttonClassName
            )}
          >
            <Phone className="h-4 w-4" />
            <span className="min-w-0 truncate">{phoneButtonLabel}</span>
          </Button>
        )}
        {showChatAction && (
          <Button
            onClick={onChat}
            aria-label="Chat with seller"
            className={cn(
              "h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-md shadow-blue-100 transition-all active:scale-[0.98]",
              layout === "flex" ? "flex-1 h-12 rounded-2xl font-bold" : "w-full",
              buttonClassName
            )}
          >
            <MessageCircle className="h-5 w-5" />
            Chat
          </Button>
        )}
      </div>

      {phoneMessage && (
        <p className="px-1 text-xs leading-5 text-muted-foreground">
          {phoneMessage}
        </p>
      )}

      {isChatLocked && (
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2">
          <MessageSquareOff className="h-3.5 w-3.5 text-foreground-subtle flex-shrink-0" />
          <p className="text-[10px] text-foreground-subtle font-medium">Chat is disabled for this ad.</p>
        </div>
      )}
    </div>
  );
}
