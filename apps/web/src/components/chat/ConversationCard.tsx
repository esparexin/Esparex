'use client';

import Link from 'next/link';
import type { IConversationDTO } from '@esparex/contracts';
import type { ConversationListView } from '@/lib/api/chatApi';
import { RelativeTimeText } from '@/components/common/RelativeTimeText';
import { formatStableNumber } from '@/lib/formatters';

export interface ConversationCardProps {
  conv: IConversationDTO;
  currentUserId: string;
  view: ConversationListView;
  onRestore: (conversationId: string) => Promise<void>;
  isRestoring: boolean;
  href: string;
  isActive: boolean;
}

function buildConversationState(conv: IConversationDTO): { label: string; tone: 'warn' | 'muted' } | null {
  if (conv.isBlocked) return { label: 'Blocked conversation', tone: 'warn' };
  if (conv.isAdClosed) return { label: 'Listing closed', tone: 'muted' };
  return null;
}

export function ConversationCard({
  conv,
  currentUserId,
  view,
  onRestore,
  isRestoring,
  href,
  isActive,
}: ConversationCardProps) {
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
            <div className="flex items-center gap-1.5 shrink-0">
              {unread > 0 && (
                <span className="conv-card__badge" aria-label={`${unread} unread messages`}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
              {conv.lastMessageAt && (
                <span className="conv-card__time">
                  <RelativeTimeText value={conv.lastMessageAt} variant="short" />
                </span>
              )}
            </div>
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
