'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useChatList } from '@/hooks/useChatList';
import { buildChatConversationRoute } from '@/lib/chatUiRoutes';
import { chatApi, type ConversationListView } from '@/lib/api/chatApi';
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import { EmptyChat } from './EmptyChat';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function buildConversationState(conv: IConversationDTO): { label: string; tone: 'warn' | 'muted' } | null {
  if (conv.isBlocked) return { label: 'Blocked conversation', tone: 'warn' };
  if (conv.isAdClosed) return { label: 'Listing closed', tone: 'muted' };
  return null;
}

function ConversationCard({
  conv,
  currentUserId,
  view,
  onRestore,
  isRestoring,
  href,
  isActive,
}: {
  conv: IConversationDTO;
  currentUserId: string;
  view: ConversationListView;
  onRestore: (conversationId: string) => Promise<void>;
  isRestoring: boolean;
  href: string;
  isActive: boolean;
}) {
  const isBuyer = conv.buyer.id === currentUserId;
  const other = isBuyer ? conv.seller : conv.buyer;
  const unread = isBuyer ? conv.unreadBuyer : conv.unreadSeller;
  const state = buildConversationState(conv);

  return (
    <article className={`conv-card-shell ${unread > 0 ? 'conv-card-shell--unread' : ''} ${isActive ? 'conv-card-shell--active' : ''}`}>
      <Link href={href} className="conv-card" aria-current={isActive ? 'page' : undefined}>
        <div className="conv-card__thumb">
          {conv.ad.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={conv.ad.thumbnail} alt={conv.ad.title} />
          ) : (
            <div className="conv-card__thumb-placeholder">🛍️</div>
          )}
        </div>

        <div className="conv-card__body">
          <div className="conv-card__top">
            <span className="conv-card__name">{other.name}</span>
            {conv.lastMessageAt && (
              <span className="conv-card__time">{timeAgo(conv.lastMessageAt)}</span>
            )}
          </div>

          <p className="conv-card__ad-title">{conv.ad.title}</p>

          {state && (
            <p className={`conv-card__state conv-card__state--${state.tone}`}>
              {state.label}
            </p>
          )}

          <div className="conv-card__bottom">
            <p className="conv-card__last-msg">
              {conv.lastMessage ?? 'No messages yet'}
            </p>
            {unread > 0 && (
              <span className="conv-card__badge" aria-label={`${unread} unread`}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </Link>

      {view === 'archived' && (
        <div className="conv-card__utility">
          <button
            type="button"
            className="conv-card__restore"
            onClick={() => {
              void onRestore(conv.id);
            }}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restoring…' : 'Restore to inbox'}
          </button>
        </div>
      )}
    </article>
  );
}

interface ChatListProps {
  currentUserId: string;
  view?: ConversationListView;
  onViewChange?: (view: ConversationListView) => void;
  activeConversationId?: string;
  conversationHrefBuilder?: (conversationId: string, view: ConversationListView) => string;
}

export function ChatList({
  currentUserId,
  view = 'active',
  onViewChange,
  activeConversationId,
  conversationHrefBuilder,
}: ChatListProps) {
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { conversations, isLoading, isLoadingMore, error, hasMore, loadMore, retry, refresh } = useChatList(view);

  const handleRestore = async (conversationId: string) => {
    try {
      setActionError(null);
      setIsRestoringId(conversationId);
      await chatApi.unhide(conversationId);
      dispatchChatInboxUpdated();
      await refresh();
    } catch {
      setActionError('Failed to restore conversation. Please try again.');
    } finally {
      setIsRestoringId(null);
    }
  };

  return (
    <div className="chat-list-shell">
      <div className="chat-list__toolbar" role="tablist" aria-label="Conversation views">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'active'}
          className={`chat-list__view-toggle ${view === 'active' ? 'is-active' : ''}`}
          onClick={() => onViewChange?.('active')}
        >
          Inbox
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'archived'}
          className={`chat-list__view-toggle ${view === 'archived' ? 'is-active' : ''}`}
          onClick={() => onViewChange?.('archived')}
        >
          Archived
        </button>
      </div>

      {actionError && (
        <div className="chat-list__inline-error" role="alert">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="chat-list chat-list--loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="conv-card-skeleton" aria-hidden />
          ))}
        </div>
      ) : error ? (
        <div className="chat-list chat-list--error">
          <p>⚠️ {error}</p>
          <button
            type="button"
            className="chat-list__retry"
            onClick={() => {
              void retry();
            }}
          >
            Retry
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <EmptyChat view={view} />
      ) : (
        <div className="chat-list">
          {conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conv={conv}
              currentUserId={currentUserId}
              view={view}
              onRestore={handleRestore}
              isRestoring={isRestoringId === conv.id}
              href={conversationHrefBuilder ? conversationHrefBuilder(conv.id, view) : buildChatConversationRoute(conv.id)}
              isActive={activeConversationId === conv.id}
            />
          ))}
          {hasMore && (
            <button
              className="chat-list__load-more"
              onClick={() => {
                void loadMore();
              }}
              disabled={isLoadingMore || Boolean(isRestoringId)}
            >
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
