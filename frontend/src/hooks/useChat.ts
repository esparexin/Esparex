/**
 * useChat — polling hook for a single conversation's messages.
 *
 * - Loads initial messages on mount and marks conversation as read.
 * - Incremental poll every POLL_INTERVAL_MS for new messages.
 * - Optimistic send: appends message locally before server ACK.
 * - Clears interval on unmount.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from '@/api/chatApi';
import type { IMessageDTO } from '@shared/contracts/chat.contracts';

const POLL_INTERVAL_MS = 4000;

interface UseChatOptions {
  conversationId: string;
  currentUserId: string;
  /** Called when the server reports the ad is now closed mid-session */
  onAdClosed?: () => void;
}

interface UseChatReturn {
  messages: IMessageDTO[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  /** True when a loadMore() is in progress (prepends older msgs — don't auto-scroll) */
  isLoadingMore: boolean;
}

export function useChat({ conversationId, currentUserId, onAdClosed }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<IMessageDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<string | undefined>(undefined);
  const latestCreatedAtRef = useRef<string | undefined>(undefined);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  /* Initial load */
  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await chatApi.messages(conversationId);
      const msgs = res.data ?? [];
      setMessages(msgs);
      setHasMore(!!res.nextCursor);
      setOldestCursor(res.nextCursor);
      if (msgs.length > 0) {
        latestCreatedAtRef.current = msgs[msgs.length - 1]?.createdAt;
      }
      // Mark as read
      await chatApi.markRead(conversationId).catch(() => {});
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  /* Polling — incremental fetch */
  const poll = useCallback(async () => {
    if (document.visibilityState === 'hidden') return; // Phase 9: pause when tab hidden
    const since = latestCreatedAtRef.current;
    if (!since) return;
    pollCountRef.current += 1;

    // Phase 5: every 10th poll (~40s), check conversation meta for live ad-close
    if (pollCountRef.current % 10 === 0 && onAdClosed) {
      try {
        const listRes = await chatApi.list();
        const meta = listRes.data?.find((c) => c.id === conversationId);
        if (meta && (meta.isAdClosed || meta.isBlocked)) {
          onAdClosed();
        }
      } catch { /* meta check failure is non-critical */ }
    }

    try {
      const res = await chatApi.poll(conversationId, since);
      const newMsgs = res.data ?? [];
      if (newMsgs.length > 0) {
        setMessages((prev) => [...prev, ...newMsgs]);
        latestCreatedAtRef.current = newMsgs[newMsgs.length - 1]?.createdAt;
        // Silently mark new messages as read
        await chatApi.markRead(conversationId).catch(() => {});
      }
    } catch {
      // Silently ignore poll failures
    }
  }, [conversationId, onAdClosed]);

  /* Load more (older messages) */
  const loadMore = useCallback(async () => {
    if (!hasMore || !oldestCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const res = await chatApi.messages(conversationId, oldestCursor);
      const older = res.data ?? [];
      setMessages((prev) => [...older, ...prev]);
      setHasMore(!!res.nextCursor);
      setOldestCursor(res.nextCursor);
    } catch {
      setError('Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, oldestCursor, isLoadingMore]);

  /* Optimistic send */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      // Optimistic: append a temp message immediately
      const tempId = `temp-${Date.now()}`;
      const optimistic: IMessageDTO = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setIsSending(true);
      try {
        const res = await chatApi.send({ conversationId, text: text.trim() });
        const confirmed = res.message;
        // Replace temp message with confirmed one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? confirmed : m))
        );
        latestCreatedAtRef.current = confirmed.createdAt;
      } catch (err) {
        // Remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError('Failed to send message');
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, currentUserId]
  );

  /* Mount / unmount */
  useEffect(() => {
    loadInitial();
    pollerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [loadInitial, poll]);

  return { messages, isLoading, isSending, isLoadingMore, error, sendMessage, loadMore, hasMore };
}
