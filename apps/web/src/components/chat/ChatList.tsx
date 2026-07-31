'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useChatList } from '@/hooks/useChatList';
import { buildChatConversationRoute } from '@/lib/chatUiRoutes';
import { chatApi, type ConversationListView } from '@/lib/api/chatApi';
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import { RelativeTimeText } from '@/components/common/RelativeTimeText';
import { formatStableNumber } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

import type { IConversationDTO } from "@esparex/contracts";

type FilterTab = 'active' | 'unread' | 'archived';

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
            <img src={conv.ad.thumbnail} alt={conv.ad.title} />
          ) : (
            <div className="conv-card__thumb-placeholder">🛍️</div>
          )}
        </div>

        <div className="conv-card__body">
          <div className="conv-card__top">
            <span className="conv-card__name">{other.name}</span>
            {conv.lastMessageAt && (
              <span className="conv-card__time">
                <RelativeTimeText value={conv.lastMessageAt} variant="short" />
              </span>
            )}
          </div>

          <div className="conv-card__ad-row">
            <p className="conv-card__ad-title">{conv.ad.title}</p>
            {typeof conv.ad.price === 'number' && (
              <span className="conv-card__ad-price">₹{formatStableNumber(conv.ad.price)}</span>
            )}
          </div>

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
              <span className="conv-card__badge" aria-label={`${unread} unread messages`}>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>(view === 'archived' ? 'archived' : 'active');

  const fetchView: ConversationListView = activeTab === 'archived' ? 'archived' : 'active';
  const { conversations, isLoading, isLoadingMore, error, hasMore, loadMore, retry, refresh } = useChatList(fetchView);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    if (tab === 'archived') onViewChange?.('archived');
    else onViewChange?.('active');
  };

  const filteredConversations = useMemo(() => {
    let list = conversations;

    if (activeTab === 'unread') {
      list = list.filter((conv) => {
        const unreadCount = conv.buyer.id === currentUserId ? conv.unreadBuyer : conv.unreadSeller;
        return unreadCount > 0;
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((conv) => {
      const other = conv.buyer.id === currentUserId ? conv.seller : conv.buyer;
      const titleMatch = conv.ad.title?.toLowerCase().includes(q);
      const nameMatch = other.name?.toLowerCase().includes(q);
      const priceMatch = String(conv.ad.price ?? '').includes(q);
      return titleMatch || nameMatch || priceMatch;
    });
  }, [conversations, activeTab, searchQuery, currentUserId]);

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
      {/* Search Input */}
      <div className="chat-list__search-wrap">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="chat-list__search-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="chat-list__search-input"
          placeholder="Search buyers, sellers, or items…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search conversations"
        />
        {searchQuery && (
          <button
            type="button"
            className="chat-list__search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="chat-list__toolbar" role="tablist" aria-label="Conversation views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'active'}
          className={`chat-list__view-toggle ${activeTab === 'active' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('active')}
        >
          Inbox
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'unread'}
          className={`chat-list__view-toggle ${activeTab === 'unread' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('unread')}
        >
          Unread
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'archived'}
          className={`chat-list__view-toggle ${activeTab === 'archived' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('archived')}
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
        <div className="chat-list chat-list--loading p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
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
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white min-h-[360px]">
          {/* Sparkle Chat Bubble Graphic */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50/80 text-3xl">
              💬
            </div>
            <span className="absolute -top-1 -right-1 text-sky-400 text-sm">✨</span>
            <span className="absolute -bottom-1 -left-1 text-sky-300 text-xs">✨</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900">
            {searchQuery
              ? `No conversations match "${searchQuery}"`
              : activeTab === 'unread'
                ? 'No unread messages'
                : activeTab === 'archived'
                  ? 'No archived conversations'
                  : 'No conversations yet'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
            {searchQuery
              ? 'Try searching with another keyword'
              : 'Messages with buyers and sellers will appear here'}
          </p>

          {!searchQuery && activeTab === 'active' && (
            <Link
              href="/browse"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-600 bg-white px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <span>💬</span>
              <span>Browse Listings</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="chat-list">
          {filteredConversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conv={conv}
              currentUserId={currentUserId}
              view={fetchView}
              onRestore={handleRestore}
              isRestoring={isRestoringId === conv.id}
              href={conversationHrefBuilder ? conversationHrefBuilder(conv.id, fetchView) : buildChatConversationRoute(conv.id)}
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

