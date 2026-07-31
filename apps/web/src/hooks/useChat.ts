/**
 * useChat — real-time Socket.IO + polling fallback hook for a single conversation.
 *
 * - Real-time message stream via Socket.IO events (`chat:message`, `chat:read`, `chat:typing`).
 * - Real-time presence indicator (`presence:get`, `presence:update`).
 * - Real-time typing indicators with 3.5s auto-dismiss.
 * - Dynamic polling: 4s when socket is disconnected, 30s background sync when socket is active.
 * - Send preserves draft on failure.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from "@/lib/api/chatApi";
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import {
  getChatSocket,
  emitChatTyping,
  queryPresenceStatus,
  type IChatMessageEvent,
  type IChatReadEvent,
  type IChatTypingEvent,
} from '@/lib/chatSocket';
import type { IMessageDTO } from "@esparex/contracts";

const POLL_ACTIVE_MS = 4000;
const POLL_FALLBACK_MS = 30000;

interface UseChatOptions {
  conversationId: string;
  currentUserId: string;
  counterpartyUserId?: string;
  /** Called when the server reports the conversation state changed mid-session */
  onConversationStateChange?: (state: { isAdClosed: boolean; isBlocked: boolean }) => void;
}

export interface UseChatReturn {
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
  isOtherTyping: boolean;
  isCounterpartyOnline: boolean;
  sendTyping: (receiverId: string, isTyping: boolean) => void;
}

export function shouldMarkConversationRead(
  messages: IMessageDTO[],
  currentUserId: string
): boolean {
  return messages.some((message) => message.senderId !== currentUserId && !message.readAt);
}

export function useChat({
  conversationId,
  currentUserId,
  counterpartyUserId,
  onConversationStateChange,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<IMessageDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<string | undefined>(undefined);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isCounterpartyOnline, setIsCounterpartyOnline] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const latestCreatedAtRef = useRef<string | undefined>(undefined);
  const onConversationStateChangeRef = useRef(onConversationStateChange);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    } catch {
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId]);

  /* Polling — incremental fetch */
  const poll = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
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
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = newMsgs.filter((m) => !existingIds.has(m.id));
          return uniqueNew.length > 0 ? [...prev, ...uniqueNew] : prev;
        });
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

  /* Send a new message */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      setIsSending(true);
      setError(null);
      try {
        const res = await chatApi.send({ conversationId, text: trimmed });
        const confirmed = res.message;
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === confirmed.id);
          return exists ? prev : [...prev, confirmed];
        });
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

  /* Send typing status over socket */
  const sendTyping = useCallback((receiverId: string, isTyping: boolean) => {
    if (!receiverId || !conversationId) return;
    emitChatTyping(conversationId, receiverId, isTyping);
  }, [conversationId]);

  /* Initial load */
  useEffect(() => {
    pollCountRef.current = 0;
    latestCreatedAtRef.current = undefined;
    void (async () => { await loadInitial(); })();
  }, [loadInitial]);

  /* Socket.IO Event Engine */
  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return undefined;

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    if (socket.connected) setSocketConnected(true);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    const handleChatMessage = (data: IChatMessageEvent) => {
      if (data.conversationId !== conversationId || !data.message) return;
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.message.id);
        return exists ? prev : [...prev, data.message];
      });
      latestCreatedAtRef.current = data.message.createdAt;
      if (data.message.senderId !== currentUserId) {
        setIsOtherTyping(false);
        void chatApi.markRead(conversationId).catch(() => {});
        dispatchChatInboxUpdated();
      }
    };

    const handleChatRead = (data: IChatReadEvent) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === currentUserId && !msg.readAt
            ? { ...msg, readAt: data.readAt }
            : msg
        )
      );
    };

    const handleChatTyping = (data: IChatTypingEvent) => {
      if (data.conversationId !== conversationId || data.senderId === currentUserId) return;
      setIsOtherTyping(Boolean(data.isTyping));

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (data.isTyping) {
        typingTimerRef.current = setTimeout(() => {
          setIsOtherTyping(false);
        }, 3500);
      }
    };

    socket.on('chat:message', handleChatMessage);
    socket.on('chat:read', handleChatRead);
    socket.on('chat:typing', handleChatTyping);

    // Initial presence query for counterparty
    if (counterpartyUserId) {
      queryPresenceStatus(counterpartyUserId, (res) => {
        if (res.userId === counterpartyUserId) {
          setIsCounterpartyOnline(res.isOnline);
        }
      });
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('chat:message', handleChatMessage);
      socket.off('chat:read', handleChatRead);
      socket.off('chat:typing', handleChatTyping);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [conversationId, currentUserId, counterpartyUserId]);

  /* Polling lifecycle — 4s when disconnected, 30s background sync when connected */
  useEffect(() => {
    const intervalMs = socketConnected ? POLL_FALLBACK_MS : POLL_ACTIVE_MS;
    pollerRef.current = setInterval(poll, intervalMs);
    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    };
  }, [poll, socketConnected]);

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
    isOtherTyping,
    isCounterpartyOnline,
    sendTyping,
  };
}

