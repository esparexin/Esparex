'use client';

import Link from 'next/link';
import type { ConversationListView } from '@/lib/api/chatApi';

export function EmptyChat({ view = 'active' }: { view?: ConversationListView }) {
  const isArchivedView = view === 'archived';
  return (
    <div className="chat-empty">
      <div className="chat-empty__illustration" aria-hidden>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none" width="96" height="96">
          <rect width="96" height="96" rx="48" fill="#F0FDF4" />
          <path d="M28 36h40v28H28z" rx="4" fill="#BBF7D0" />
          <path d="M36 52h24M36 44h12" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
          <path d="M44 64l-8 6v-6H28V36h12" stroke="#16A34A" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="chat-empty__title">
        {isArchivedView ? 'No archived conversations' : 'No conversations yet'}
      </h2>
      <p className="chat-empty__subtitle">
        {isArchivedView
          ? 'Archived chats will appear here until you restore them to your inbox.'
          : 'Your messages about ads, services, and spare parts will appear here once a conversation starts.'}
      </p>
      {!isArchivedView && (
        <Link href="/" className="chat-empty__cta">
          Explore Marketplace
        </Link>
      )}
    </div>
  );
}
