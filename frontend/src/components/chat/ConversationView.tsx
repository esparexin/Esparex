'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { QuickReplies } from './QuickReplies';
import { ChatReadOnly } from './ChatReadOnly';
import { ChatActionsMenu } from './ChatActionsMenu';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';

interface ConversationViewProps {
  conversation: IConversationDTO;
  currentUserId: string;
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

export function ConversationView({ conversation, currentUserId }: ConversationViewProps) {
  const router = useRouter();
  const isBuyer = conversation.buyer.id === currentUserId;
  const [showSafetyTips, setShowSafetyTips] = useState(true);
  const [quickReplyText, setQuickReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Local override so block/hide actions immediately update UI without a full page reload
  const [localBlocked, setLocalBlocked] = useState(false);
  const [localAdClosed, setLocalAdClosed] = useState(false);
  const [localHidden, setLocalHidden] = useState(false);

  const isBlocked = localBlocked || conversation.isBlocked;
  const isAdClosed = localAdClosed || conversation.isAdClosed;
  const isReadOnly = isBlocked || isAdClosed;
  const readOnlyReason: 'sold' | 'expired' | 'blocked' | 'admin' = isBlocked
    ? 'blocked'
    : isAdClosed
      ? 'expired'
      : 'admin';

  const handleActionComplete = (action: 'block' | 'hide') => {
    if (action === 'block') setLocalBlocked(true);
    if (action === 'hide') setLocalHidden(true);
  };

  // If the user hides the conversation, redirect back to inbox
  useEffect(() => {
    if (localHidden) {
      router.push('/chat');
    }
  }, [localHidden, router]);

  const { messages, isLoading, isSending, isLoadingMore, error, sendMessage, loadMore, hasMore } = useChat({
    conversationId: conversation.id,
    currentUserId,
    // Phase 5: detect live ad-close (ad sold/expired while conversation is open)
    onAdClosed: () => setLocalAdClosed(true),
  });

  // Phase 8: Auto-scroll to bottom on NEW messages only (not when loading older)
  useEffect(() => {
    if (!isLoadingMore) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoadingMore]);

  const handleSend = async (text: string) => {
    setQuickReplyText('');
    await sendMessage(text);
  };

  const handleQuickReply = (text: string) => {
    setQuickReplyText(text);
  };

  // Render date separator between messages on different days
  let lastDate = '';

  return (
    <div className="conversation-view">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="conv-header">
        <div className="conv-header__ad">
          {conversation.ad.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conversation.ad.thumbnail}
              alt={conversation.ad.title}
              className="conv-header__ad-thumb"
            />
          )}
          <div className="conv-header__ad-info">
            <p className="conv-header__ad-title">{conversation.ad.title}</p>
            {conversation.ad.price && (
              <p className="conv-header__ad-price">₹{conversation.ad.price.toLocaleString()}</p>
            )}
          </div>
        </div>
        <div className="conv-header__other">
          <span className="conv-header__with">
            {isBuyer ? conversation.seller.name : conversation.buyer.name}
          </span>
          <ChatActionsMenu
            conversationId={conversation.id}
            onActionComplete={handleActionComplete}
          />
        </div>
      </header>

      {/* ── Safety Tips ─────────────────────────────────────────── */}
      {showSafetyTips && (
        <SafetyTips onDismiss={() => setShowSafetyTips(false)} />
      )}

      {/* ── Message List ────────────────────────────────────────── */}
      <div className="conv-messages" role="log" aria-live="polite">
        {hasMore && (
          <div className="conv-messages__load-more">
            <button onClick={loadMore} className="conv-messages__load-btn">
              Load earlier messages
            </button>
          </div>
        )}
        {isLoading && (
          <div className="conv-messages__loading">
            <span className="chat-spinner" aria-label="Loading…" />
          </div>
        )}
        {error && (
          <div className="conv-messages__error">{error}</div>
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
