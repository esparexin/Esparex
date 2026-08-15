'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { useChatAutoScroll } from '@/hooks/useChatAutoScroll';
import { buildPublicListingDetailRoute } from '@/lib/publicListingRoutes';
import { buildChatInboxRoute, resolveChatInboxView, resolveChatReturnTo } from '@/lib/chatUiRoutes';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { QuickReplies } from './QuickReplies';
import { ChatReadOnly } from './ChatReadOnly';
import { SafetyTips } from './SafetyTips';
import { DateSeparator } from './DateSeparator';
import { ConversationHeader } from './ConversationHeader';
import { MessageSquare } from "@/icons/IconRegistry";
import { decodeHtmlEntities } from "@/lib/formatters";
import type { IConversationDTO } from "@esparex/contracts";

interface ConversationViewProps {
  conversation: IConversationDTO;
  currentUserId: string;
  embedded?: boolean;
}

export function ConversationView({ conversation, currentUserId, embedded = false }: ConversationViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyer = conversation.buyer.id === currentUserId;
  const [showSafetyTips, setShowSafetyTips] = useState(true);
  const [quickReplyText, setQuickReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const otherPartyName = isBuyer ? conversation.seller.name : conversation.buyer.name;
  const cleanAdTitle = decodeHtmlEntities(conversation.ad.title);
  const inboxView = resolveChatInboxView(searchParams.get('view'));
  const defaultReturnTo = buildChatInboxRoute(inboxView);
  const returnTo = resolveChatReturnTo(searchParams.get('returnTo'), defaultReturnTo);
  const listingHref = conversation.ad.id
    ? buildPublicListingDetailRoute({
      id: conversation.ad.id,
      listingType: conversation.ad.listingType,
      seoSlug: conversation.ad.seoSlug,
      title: cleanAdTitle,
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

  const counterpartyUserId = isBuyer ? conversation.seller.id : conversation.buyer.id;

  const {
    messages,
    isLoading,
    isSending,
    isLoadingMore,
    error,
    sendMessage,
    retryFailedMessage,
    loadMore,
    hasMore,
    retry,
    isOtherTyping,
    isCounterpartyOnline,
    sendTyping,
  } = useChat({
    conversationId: conversation.id,
    currentUserId,
    counterpartyUserId,
    onConversationStateChange: ({ isAdClosed: nextAdClosed, isBlocked: nextBlocked }) => {
      if (nextBlocked) setLocalBlocked(true);
      if (nextAdClosed) setLocalAdClosed(true);
    },
  });

  const { handleLoadMore, markUserSent, clearUserSent } = useChatAutoScroll({
    messagesContainerRef,
    messageCount: messages.length,
    isLoadingMore,
    isOtherTyping,
  });

  const handleSend = async (text: string, attachmentFile?: File) => {
    markUserSent();
    const success = await sendMessage(text, attachmentFile);
    if (success) {
      setQuickReplyText('');
      sendTyping(counterpartyUserId, false);
    } else {
      clearUserSent();
    }
    return success;
  };

  const handleQuickReply = (text: string) => {
    setQuickReplyText(text);
  };

  const handleTypingChange = (isTyping: boolean) => {
    sendTyping(counterpartyUserId, isTyping);
  };

  return (
    <div className={`conversation-view ${embedded ? 'conversation-view--embedded' : ''} h-full min-h-0 flex flex-col overflow-hidden bg-white`}>
      <ConversationHeader
        embedded={embedded}
        inboxView={inboxView}
        returnTo={returnTo}
        backLabel={backLabel}
        otherPartyName={otherPartyName}
        isCounterpartyOnline={isCounterpartyOnline}
        isOtherTyping={isOtherTyping}
        isArchived={isArchived}
        conversation={conversation}
        cleanAdTitle={cleanAdTitle}
        listingHref={listingHref}
        onActionComplete={handleActionComplete}
      />

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
      <div className="conv-messages" ref={messagesContainerRef} role="log" aria-live="polite">
        {hasMore && (
          <div className="conv-messages__load-more">
            <button
              onClick={() => {
                void handleLoadMore(loadMore);
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
        {messages.length === 0 && !isLoading && (
          <div className="py-3 px-3 flex flex-col items-center justify-center text-center max-w-xs mx-auto shrink-0 mb-2">
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 shadow-2xs border border-blue-100">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 tracking-tight">
              Start a conversation with {otherPartyName}
            </h4>
            {cleanAdTitle && (
              <p className="text-tiny text-slate-500 mt-0.5 line-clamp-2 max-w-[260px] leading-tight">
                Inquiring about <span className="font-semibold text-slate-700">{cleanAdTitle}</span>
              </p>
            )}
          </div>
        )}

        {Array.from(new Map(messages.map((m) => [m.id || m.tempId || m.createdAt, m])).values()).map((msg, index, arr) => {
          const msgDate = msg.createdAt.slice(0, 10);
          const prevMsgDate = index > 0 ? arr[index - 1]?.createdAt.slice(0, 10) : '';
          const showSep = msgDate !== prevMsgDate;
          const uniqueKey = msg.id || msg.tempId || `${index}`;
          return (
            <div key={uniqueKey}>
              {showSep && <DateSeparator date={msg.createdAt} />}
              <MessageBubble
                message={msg}
                isOwn={msg.senderId === currentUserId}
                onRetry={retryFailedMessage}
              />
            </div>
          );
        })}

        {isOtherTyping && (
          <div className="chat-typing-bubble" role="status" aria-label={`${otherPartyName} is typing`}>
            <span>{otherPartyName} is typing…</span>
          </div>
        )}

        {!isReadOnly && messages.length === 0 && (
          <QuickReplies
            onSelect={handleQuickReply}
            disabled={isSending}
          />
        )}

        <div ref={bottomRef} aria-hidden />
      </div>

      {/* ── Bottom Zone ─────────────────────────────────────────── */}
      <div className="conv-bottom">
        {isReadOnly ? (
          <ChatReadOnly reason={readOnlyReason} />
        ) : (
          <ChatInput
            value={quickReplyText}
            onValueChange={setQuickReplyText}
            onSend={handleSend}
            onTypingChange={handleTypingChange}
            isSending={isSending}
            disabled={isReadOnly}
          />
        )}
      </div>
    </div>
  );
}

