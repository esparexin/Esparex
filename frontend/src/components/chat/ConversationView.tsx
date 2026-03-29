'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { buildPublicListingDetailRoute } from '@/lib/publicListingRoutes';
import { buildChatInboxRoute, resolveChatInboxView, resolveChatReturnTo } from '@/lib/chatUiRoutes';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { QuickReplies } from './QuickReplies';
import { ChatReadOnly } from './ChatReadOnly';
import { ChatActionsMenu } from './ChatActionsMenu';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';

interface ConversationViewProps {
  conversation: IConversationDTO;
  currentUserId: string;
  embedded?: boolean;
}

function SafetyTips({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="safety-banner" role="note">
      <p className="safety-banner__text">
        🛡️ <strong>Stay safe:</strong> Never share bank details or send money before meeting in person.
      </p>
      <button className="safety-banner__close" onClick={onDismiss} aria-label="Dismiss safety tips">
        ✕
      </button>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  const label = new Date(date).toLocaleDateString([], {
    weekday: 'long', month: 'short', day: 'numeric'
  });
  return (
    <div className="date-separator" role="separator" aria-label={label}>
      <span>{label}</span>
    </div>
  );
}

export function ConversationView({ conversation, currentUserId, embedded = false }: ConversationViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyer = conversation.buyer.id === currentUserId;
  const [showSafetyTips, setShowSafetyTips] = useState(true);
  const [quickReplyText, setQuickReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const otherPartyName = isBuyer ? conversation.seller.name : conversation.buyer.name;
  const inboxView = resolveChatInboxView(searchParams.get('view'));
  const defaultReturnTo = buildChatInboxRoute(inboxView);
  const returnTo = resolveChatReturnTo(searchParams.get('returnTo'), defaultReturnTo);
  const listingHref = conversation.ad.id
    ? buildPublicListingDetailRoute({
      id: conversation.ad.id,
      listingType: conversation.ad.listingType,
      seoSlug: conversation.ad.seoSlug,
      title: conversation.ad.title,
    })
    : null;
  const backLabel = returnTo === defaultReturnTo
    ? inboxView === 'archived' ? 'Archived' : 'Inbox'
    : 'Back';

  // Local override so block/hide actions immediately update UI without a full page reload
  const [localBlocked, setLocalBlocked] = useState(false);
  const [localAdClosed, setLocalAdClosed] = useState(false);
  const [archivedOverride, setArchivedOverride] = useState<boolean | null>(null);
  const [localHidden, setLocalHidden] = useState(false);

  const isBlocked = localBlocked || conversation.isBlocked;
  const isAdClosed = localAdClosed || conversation.isAdClosed;
  const isArchived = archivedOverride ?? Boolean(conversation.isArchivedForViewer);
  const isReadOnly = isBlocked || isAdClosed;
  const readOnlyReason: 'sold' | 'expired' | 'blocked' | 'admin' = isBlocked
    ? 'blocked'
    : isAdClosed
      ? 'expired'
      : 'admin';

  const handleActionComplete = (action: 'block' | 'hide' | 'restore') => {
    if (action === 'block') setLocalBlocked(true);
    if (action === 'hide') {
      setArchivedOverride(true);
      setLocalHidden(true);
    }
    if (action === 'restore') {
      setArchivedOverride(false);
      setLocalHidden(false);
    }
  };

  useEffect(() => {
    if (localHidden) {
      router.push(buildChatInboxRoute('archived'));
    }
  }, [localHidden, router]);

  const { messages, isLoading, isSending, isLoadingMore, error, sendMessage, loadMore, hasMore, retry } = useChat({
    conversationId: conversation.id,
    currentUserId,
    onConversationStateChange: (state) => {
      if (state.isAdClosed) setLocalAdClosed(true);
      if (state.isBlocked) setLocalBlocked(true);
    },
  });

  // Phase 8: Auto-scroll to bottom on NEW messages only (not when loading older)
  useEffect(() => {
    if (!isLoadingMore) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoadingMore]);

  const handleSend = async (text: string) => {
    const didSend = await sendMessage(text);
    if (didSend) {
      setQuickReplyText('');
    }
    return didSend;
  };

  const handleQuickReply = (text: string) => {
    setQuickReplyText(text);
  };

  // Render date separator between messages on different days
  let lastDate = '';

  return (
    <div className={`conversation-view ${embedded ? 'conversation-view--embedded' : ''}`}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="conv-header">
        <div className="conv-header__nav">
          <Link href={returnTo} className="conv-header__nav-link">
            {backLabel}
          </Link>
          {listingHref && (
            <Link href={listingHref} className="conv-header__nav-link conv-header__nav-link--accent">
              View listing
            </Link>
          )}
        </div>

        <div className="conv-header__main">
          <div className="conv-header__ad">
            {conversation.ad.thumbnail && (
              listingHref ? (
                <Link href={listingHref} className="conv-header__thumb-link" aria-label={`Open ${conversation.ad.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={conversation.ad.thumbnail}
                    alt={conversation.ad.title}
                    className="conv-header__ad-thumb"
                  />
                </Link>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={conversation.ad.thumbnail}
                  alt={conversation.ad.title}
                  className="conv-header__ad-thumb"
                />
              )
            )}
            <div className="conv-header__ad-info">
              <p className="conv-header__eyebrow">{otherPartyName}</p>
              {listingHref ? (
                <Link href={listingHref} className="conv-header__listing-link">
                  {conversation.ad.title}
                </Link>
              ) : (
                <p className="conv-header__ad-title">{conversation.ad.title}</p>
              )}
              {conversation.ad.price && (
                <p className="conv-header__ad-price">₹{conversation.ad.price.toLocaleString()}</p>
              )}
            </div>
          </div>

          <div className="conv-header__other">
            <span className="conv-header__with">
              {isArchived ? 'Archived conversation' : `Chat with ${otherPartyName}`}
            </span>
            <ChatActionsMenu
              conversationId={conversation.id}
              isArchived={Boolean(isArchived)}
              onActionComplete={handleActionComplete}
            />
          </div>
        </div>
      </header>

      {/* ── Safety Tips ─────────────────────────────────────────── */}
      {showSafetyTips && (
        <SafetyTips onDismiss={() => setShowSafetyTips(false)} />
      )}

      {isArchived && (
        <div className="chat-thread-banner" role="status">
          <span>This conversation is archived. Restore it from the menu if you want it back in your inbox.</span>
        </div>
      )}

      {/* ── Message List ────────────────────────────────────────── */}
      <div className="conv-messages" role="log" aria-live="polite">
        {hasMore && (
          <div className="conv-messages__load-more">
            <button
              onClick={() => {
                void loadMore();
              }}
              className="conv-messages__load-btn"
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading earlier messages…' : 'Load earlier messages'}
            </button>
          </div>
        )}
        {isLoading && (
          <div className="conv-messages__loading">
            <span className="chat-spinner" aria-label="Loading…" />
          </div>
        )}
        {error && (
          <div className="conv-messages__error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="conv-messages__retry"
              onClick={() => {
                void retry();
              }}
            >
              Retry
            </button>
          </div>
        )}
        {messages.map((msg) => {
          const msgDate = msg.createdAt.slice(0, 10);
          const showSep = msgDate !== lastDate;
          lastDate = msgDate;
          return (
            <div key={msg.id}>
              {showSep && <DateSeparator date={msg.createdAt} />}
              <MessageBubble
                message={msg}
                isOwn={msg.senderId === currentUserId}
              />
            </div>
          );
        })}
        <div ref={bottomRef} aria-hidden />
      </div>

      {/* ── Bottom Zone ─────────────────────────────────────────── */}
      <div className="conv-bottom">
        {isReadOnly ? (
          <ChatReadOnly reason={readOnlyReason} />
        ) : (
          <>
            <QuickReplies
              onSelect={handleQuickReply}
              disabled={isSending}
            />
            <ChatInput
              value={quickReplyText}
              onValueChange={setQuickReplyText}
              onSend={handleSend}
              isSending={isSending}
              disabled={isReadOnly}
            />
          </>
        )}
      </div>
    </div>
  );
}
