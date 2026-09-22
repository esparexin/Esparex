'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useChatList } from '@/hooks/useChatList';
import { buildChatConversationRoute } from '@/lib/chatUiRoutes';
import type { ConversationListView } from '@/lib/api/chatApi';
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import { Skeleton, MessageCircle, Search } from "@esparex/ui";
import { ConversationCard } from './ConversationCard';

type FilterTab = 'active' | 'unread' | 'archived';

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
  const { conversations, isLoading, isLoadingMore, error, hasMore, loadMore, retry, unhideConversation } = useChatList(fetchView);

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
    if (q) {
      list = list.filter((conv) => {
        const other = conv.buyer.id === currentUserId ? conv.seller : conv.buyer;
        const titleMatch = conv.ad.title?.toLowerCase().includes(q);
        const nameMatch = other.name?.toLowerCase().includes(q);
        const priceMatch = String(conv.ad.price ?? '').includes(q);
        return titleMatch || nameMatch || priceMatch;
      });
    }

    // ── Sorting Governance ──────────────────────────────────────────────────────
    // 1. Open ads (isAdClosed = false) come FIRST; Closed ads (isAdClosed = true) come LAST.
    // 2. Within each group, sort by most recent chat activity (lastMessageAt / createdAt) descending.
    return [...list].sort((a, b) => {
      const aClosed = a.isAdClosed ? 1 : 0;
      const bClosed = b.isAdClosed ? 1 : 0;
      if (aClosed !== bClosed) {
        return aClosed - bClosed;
      }
      const aTime = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [conversations, activeTab, searchQuery, currentUserId]);

  const handleRestore = async (conversationId: string) => {
    try {
      setActionError(null);
      setIsRestoringId(conversationId);
      await unhideConversation(conversationId);
      dispatchChatInboxUpdated();
    } catch {
      setActionError('Failed to restore conversation. Please try again.');
    } finally {
      setIsRestoringId(null);
    }
  };

  return (
    <div className="chat-list-shell h-full min-h-0 md:max-h-[480px] flex flex-col overflow-hidden">
      {/* Search Input */}
      <div className="chat-list__search-wrap">
        <Search className="chat-list__search-icon w-4 h-4 shrink-0" aria-hidden />
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
        <div className="flex flex-col items-center justify-center p-8 text-center bg-background min-h-[360px]">
          {/* Sparkle Chat Bubble Graphic */}
          <div className="mb-3 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border text-foreground-subtle">
              <MessageCircle className="h-8 w-8" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-foreground">
            {searchQuery
              ? `No conversations match "${searchQuery}"`
              : activeTab === 'unread'
                ? 'No unread messages'
                : activeTab === 'archived'
                  ? 'No archived conversations'
                  : 'No conversations yet'}
          </h3>
          <p className="mt-1 text-xs text-foreground-subtle max-w-xs leading-relaxed">
            {searchQuery
              ? 'Try searching with another keyword'
              : 'Messages with buyers and sellers will appear here'}
          </p>

          {!searchQuery && activeTab === 'active' && (
            <Link
              href="/browse"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-primary bg-background px-4 py-2 text-xs font-semibold text-primary hover:bg-muted transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <span>💬</span>
              <span>Browse Listings</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="chat-list flex-1 min-h-0 overflow-y-auto">
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

