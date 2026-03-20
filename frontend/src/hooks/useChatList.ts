/**
 * useChatList — polling hook for the conversations inbox.
 * Refreshes every 10 seconds. Supports cursor pagination.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from '@/api/chatApi';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';

const POLL_INTERVAL_MS = 10_000;

interface UseChatListReturn {
  conversations: IConversationDTO[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useChatList(): UseChatListReturn {
  const [conversations, setConversations] = useState<IConversationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await chatApi.list();
      setConversations(res.data ?? []);
      setHasMore(!!res.nextCursor);
      setCursor(res.nextCursor);
    } catch {
      setError('Failed to load inbox');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await chatApi.list();
      setConversations(res.data ?? []);
      setHasMore(!!res.nextCursor);
      setCursor(res.nextCursor);
    } catch {
      // silent refresh
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor) return;
    try {
      const res = await chatApi.list(cursor);
      setConversations((prev) => [...prev, ...(res.data ?? [])]);
      setHasMore(!!res.nextCursor);
      setCursor(res.nextCursor);
    } catch {
      setError('Failed to load more');
    }
  }, [hasMore, cursor]);

  useEffect(() => {
    load();
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

  return { conversations, isLoading, error, hasMore, loadMore, refresh };
}
