/**
 * useChat — polling hook for a single conversation's messages.
 *
 * - Loads initial messages on mount and marks conversation as read.
 * - Incremental poll every POLL_INTERVAL_MS for new messages.
 * - Send preserves the user's draft on failure instead of clearing it.
 * - Clears interval on unmount.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from "@/lib/api/chatApi";
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import type { IMessageDTO } from '@shared/contracts/chat.contracts';

const POLL_INTERVAL_MS = 4000;

interface UseChatOptions {
  conversationId: string;
  currentUserId: string;
  /** Called when the server reports the conversation state changed mid-session */
  onConversationStateChange?: (state: { isAdClosed: boolean; isBlocked: boolean }) => void;
}

interface UseChatReturn {
  messages: IMessageDTO[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<boolean>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  /** True when a loadMore() is in progress (prepends older msgs — don't auto-scroll) */
  isLoadingMore: boolean;
  retry: () => Promise<void>;
}

export function shouldMarkConversationRead(
  messages: IMessageDTO[],
  currentUserId: string
): boolean {
  return messages.some((message) => message.senderId !== currentUserId && !message.readAt);
}

export function useChat({ conversationId, currentUserId, onConversationStateChange }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<IMessageDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<string | undefined>(undefined);
  const latestCreatedAtRef = useRef<string | undefined>(undefined);
  const onConversationStateChangeRef = useRef(onConversationStateChange);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    onConversationStateChangeRef.current = onConversationStateChange;
  }, [onConversationStateChange]);

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
      } else {
        latestCreatedAtRef.current = undefined;
      }
      if (shouldMarkConversationRead(msgs, currentUserId)) {
        await chatApi.markRead(conversationId).catch(() => {});
        dispatchChatInboxUpdated();
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId]);

  /* Polling — incremental fetch */
  const poll = useCallback(async () => {
    if (document.visibilityState === 'hidden') return; // Phase 9: pause when tab hidden
    const since = latestCreatedAtRef.current;
    if (!since) return;
    pollCountRef.current += 1;

    const handleConversationStateChange = onConversationStateChangeRef.current;
    if (pollCountRef.current % 10 === 0 && handleConversationStateChange) {
      try {
        const metaRes = await chatApi.conversation(conversationId);
        const meta = metaRes.data;
        if (meta && (meta.isAdClosed || meta.isBlocked)) {
          handleConversationStateChange({
            isAdClosed: meta.isAdClosed,
            isBlocked: meta.isBlocked,
          });
        }
      } catch { /* meta check failure is non-critical */ }
    }

    try {
      const res = await chatApi.poll(conversationId, since);
      const newMsgs = res.data ?? [];
      if (newMsgs.length > 0) {
        setMessages((prev) => [...prev, ...newMsgs]);
        latestCreatedAtRef.current = newMsgs[newMsgs.length - 1]?.createdAt;
        if (shouldMarkConversationRead(newMsgs, currentUserId)) {
          await chatApi.markRead(conversationId).catch(() => {});
          dispatchChatInboxUpdated();
        }
      }
    } catch {
      // Silently ignore poll failures
    }
  }, [conversationId, currentUserId]);

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

  /* Send a new message and keep the draft intact if the request fails */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      setIsSending(true);
      setError(null);
      try {
        const res = await chatApi.send({ conversationId, text: trimmed });
        const confirmed = res.message;
        setMessages((prev) => [...prev, confirmed]);
        latestCreatedAtRef.current = confirmed.createdAt;
        dispatchChatInboxUpdated();
        return true;
      } catch (err) {
        const message = err instanceof Error && err.message
          ? err.message
          : 'Failed to send message';
        setError(message);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId]
  );

  /* Initial load only when the conversation changes */
  useEffect(() => {
    pollCountRef.current = 0;
    latestCreatedAtRef.current = undefined;
    void loadInitial();
  }, [loadInitial]);

  /* Polling lifecycle */
  useEffect(() => {
    pollerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    };
  }, [poll]);

  return {
    messages,
    isLoading,
    isSending,
    isLoadingMore,
    error,
    sendMessage,
    loadMore,
    hasMore,
    retry: loadInitial,
  };
}
