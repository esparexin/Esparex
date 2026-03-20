'use client';

import Link from 'next/link';
import { useChatList } from '@/hooks/useChatList';
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

function ConversationCard({ conv, currentUserId }: { conv: IConversationDTO; currentUserId: string }) {
  const isBuyer = conv.buyer.id === currentUserId;
  const other = isBuyer ? conv.seller : conv.buyer;
  const unread = isBuyer ? conv.unreadBuyer : conv.unreadSeller;

  return (
    <Link href={`/chat/${conv.id}`} className="conv-card">
      {/* Ad thumbnail */}
      <div className="conv-card__thumb">
        {conv.ad.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={conv.ad.thumbnail} alt={conv.ad.title} />
        ) : (
          <div className="conv-card__thumb-placeholder">🛍️</div>
        )}
      </div>
      {/* Content */}
      <div className="conv-card__body">
        <div className="conv-card__top">
          <span className="conv-card__name">{other.name}</span>
          {conv.lastMessageAt && (
            <span className="conv-card__time">{timeAgo(conv.lastMessageAt)}</span>
          )}
        </div>
        <p className="conv-card__ad-title">{conv.ad.title}</p>
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
  );
}

interface ChatListProps {
  currentUserId: string;
}

export function ChatList({ currentUserId }: ChatListProps) {
  const { conversations, isLoading, error, hasMore, loadMore } = useChatList();

  if (isLoading) {
    return (
      <div className="chat-list chat-list--loading">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="conv-card-skeleton" aria-hidden />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-list chat-list--error">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return <EmptyChat />;
  }

  return (
    <div className="chat-list">
      {conversations.map((conv) => (
        <ConversationCard key={conv.id} conv={conv} currentUserId={currentUserId} />
      ))}
      {hasMore && (
        <button className="chat-list__load-more" onClick={loadMore}>
          Load more
        </button>
      )}
    </div>
  );
}
