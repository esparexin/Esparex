/**
 * useChatList — polling hook for the conversations inbox.
 * Refreshes every 10 seconds. Supports cursor pagination.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi, type ConversationListView } from "@/lib/api/chatApi";
import { CHAT_INBOX_UPDATED_EVENT } from '@/lib/chatEvents';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';

const POLL_INTERVAL_MS = 10_000;

interface UseChatListReturn {
  conversations: IConversationDTO[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

export function mergeRefreshedConversations(
  existing: IConversationDTO[],
  refreshed: IConversationDTO[]
): IConversationDTO[] {
  if (existing.length === 0) {
    return refreshed;
  }

  const refreshedIds = new Set(refreshed.map((conversation) => conversation.id));
  const preservedTail = existing.filter((conversation) => !refreshedIds.has(conversation.id));

  return [...refreshed, ...preservedTail];
}

export function useChatList(view: ConversationListView = 'active'): UseChatListReturn {
  const [conversations, setConversations] = useState<IConversationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasLoadedMoreRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await chatApi.list(undefined, view);
      hasLoadedMoreRef.current = false;
      setConversations(res.data ?? []);
      setHasMore(!!res.nextCursor);
      setCursor(res.nextCursor);
    } catch {
      setError('Failed to load inbox');
    } finally {
      setIsLoading(false);
    }
  }, [view]);

  const refresh = useCallback(async () => {
    try {
      const res = await chatApi.list(undefined, view);
      const refreshed = res.data ?? [];

      setConversations((prev) =>
        hasLoadedMoreRef.current
          ? mergeRefreshedConversations(prev, refreshed)
          : refreshed
      );

      if (!hasLoadedMoreRef.current) {
        setHasMore(!!res.nextCursor);
        setCursor(res.nextCursor);
      }
    } catch {
      // silent refresh
    }
  }, [view]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const res = await chatApi.list(cursor, view);
      hasLoadedMoreRef.current = true;
      setConversations((prev) => [...prev, ...(res.data ?? [])]);
      setHasMore(!!res.nextCursor);
      setCursor(res.nextCursor);
    } catch {
      setError('Failed to load more');
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, cursor, isLoadingMore, view]);

  useEffect(() => {
    void load();
    pollerRef.current = setInterval(() => {
      // Phase 9: skip silent refresh if tab is not visible
      if (document.visibilityState !== 'hidden') {
        void refresh();
      }
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [load, refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleInboxUpdate = () => {
      void refresh();
    };
    window.addEventListener(CHAT_INBOX_UPDATED_EVENT, handleInboxUpdate);
    return () => {
      window.removeEventListener(CHAT_INBOX_UPDATED_EVENT, handleInboxUpdate);
    };
  }, [refresh]);

  return { conversations, isLoading, isLoadingMore, error, hasMore, loadMore, refresh, retry: load };
}
