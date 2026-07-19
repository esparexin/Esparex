'use client';

import { useEffect, useRef, useState } from 'react';
import { chatApi } from '@/lib/api/chatApi';
import { CHAT_INBOX_UPDATED_EVENT } from '@/lib/chatEvents';
import type { IConversationDTO } from "@esparex/contracts";

const POLL_INTERVAL_MS = 30_000;

function getUnreadCount(conversations: IConversationDTO[], currentUserId?: string | null): number {
  if (!currentUserId) return 0;

  return conversations.reduce((total, conversation) => {
    const isBuyer = conversation.buyer.id === currentUserId;
    const unread = isBuyer ? conversation.unreadBuyer : conversation.unreadSeller;
    return total + unread;
  }, 0);
}

export function useChatUnreadCount(currentUserId?: string | null, enabled = true): number {
  const [rawCount, setRawCount] = useState(0);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!enabled || !currentUserId) {
      return undefined;
    }

    let cancelled = false;

    const loadUnreadCount = async () => {
      try {
        const response = await chatApi.list(undefined, 'active');
        if (!cancelled) {
          setRawCount(getUnreadCount(response.data ?? [], currentUserIdRef.current));
        }
      } catch {
        if (!cancelled) {
          setRawCount(0);
        }
      }
    };

    void loadUnreadCount();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        void loadUnreadCount();
      }
    }, POLL_INTERVAL_MS);

    const handleInboxUpdated = () => {
      void loadUnreadCount();
    };

    window.addEventListener(CHAT_INBOX_UPDATED_EVENT, handleInboxUpdated);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener(CHAT_INBOX_UPDATED_EVENT, handleInboxUpdated);
    };
  }, [currentUserId, enabled]);

  // Return 0 when disabled or not logged in — avoids setState-in-effect for the reset case.
  return enabled && currentUserId ? rawCount : 0;
}
