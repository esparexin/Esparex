"use client";

import Link from "next/link";
import { ChevronLeft } from "@/icons/IconRegistry";
import { buildChatInboxRoute, type ChatInboxView } from "@/lib/chatUiRoutes";
import { ChatActionsMenu } from "./ChatActionsMenu";
import type { IConversationDTO } from "@esparex/contracts";
import { formatStableNumber } from "@/lib/formatters";

interface ConversationHeaderProps {
  embedded: boolean;
  inboxView?: ChatInboxView;
  returnTo: string;
  backLabel: string;
  otherPartyName: string;
  isCounterpartyOnline: boolean;
  isOtherTyping: boolean;
  isArchived: boolean;
  conversation: IConversationDTO;
  cleanAdTitle: string;
  listingHref: string | null;
  onActionComplete: (action: 'block' | 'hide' | 'restore') => void;
}

export function ConversationHeader({
  embedded,
  inboxView,
  returnTo,
  backLabel,
  otherPartyName,
  isCounterpartyOnline,
  isOtherTyping,
  isArchived,
  conversation,
  cleanAdTitle,
  listingHref,
  onActionComplete,
}: ConversationHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-3.5 py-2 bg-card border-b border-border shrink-0 gap-2.5">
      {/* Left: Back button (on mobile) + Counterparty info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {embedded ? (
          <Link
            href={buildChatInboxRoute(inboxView)}
            className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted text-foreground-secondary shrink-0 transition-colors"
            aria-label="Back to conversations"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <Link
            href={returnTo}
            className="inline-flex items-center gap-1 text-caption font-semibold text-primary hover:text-primary/80 shrink-0"
            aria-label={backLabel}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Link>
        )}

        {/* Counterparty Avatar & Details */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-caption">
              {otherPartyName.charAt(0).toUpperCase()}
            </div>
            {isCounterpartyOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" title="Online" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-body font-semibold text-foreground truncate">{otherPartyName}</h3>
              {isCounterpartyOnline && (
                <span className="text-tiny font-medium text-emerald-600">Online</span>
              )}
              {isOtherTyping && (
                <span className="text-tiny font-medium text-primary animate-pulse">typing…</span>
              )}
            </div>
            {isArchived && (
              <p className="text-tiny text-amber-600 font-medium">Archived conversation</p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Compact Ad Pill Card + Actions Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {conversation.ad && (
          <div className="hidden sm:flex items-center gap-2 bg-muted/40 border border-border rounded-xl px-2.5 py-1.5 max-w-[260px]">
            {conversation.ad.thumbnail && (
              <img
                src={conversation.ad.thumbnail}
                alt={cleanAdTitle}
                className="h-8 w-8 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="min-w-0 text-left">
              {listingHref ? (
                <Link href={listingHref} className="text-caption font-semibold text-foreground hover:text-primary truncate block">
                  {cleanAdTitle}
                </Link>
              ) : (
                <p className="text-caption font-semibold text-foreground truncate">{cleanAdTitle}</p>
              )}
              {typeof conversation.ad.price === 'number' && (
                <p className="text-tiny font-bold text-emerald-700">₹{formatStableNumber(conversation.ad.price)}</p>
              )}
            </div>
          </div>
        )}

        <ChatActionsMenu
          conversationId={conversation.id}
          isArchived={isArchived}
          onActionComplete={onActionComplete}
        />
      </div>
    </header>
  );
}
