/**
 * useChat — real-time Socket.IO + polling fallback hook for a single conversation.
 *
 * - Real-time message stream via Socket.IO events (`chat:message`, `chat:read`, `chat:typing`).
 * - Real-time presence indicator (`presence:get`, `presence:update`).
 * - Real-time typing indicators with 3.5s auto-dismiss.
 * - Dynamic polling: 4s when socket is disconnected, 30s background sync when socket is active.
 * - Optimistic message sending with rich delivery statuses ('sending' | 'sent' | 'read' | 'failed').
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from "@/lib/api/chatApi";
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import { useChatSocketEngine, withDeliveryStatus, shouldMarkConversationRead } from './useChatSocketEngine';
import { useChatPollingEngine } from './useChatPollingEngine';
import { uploadChatAttachment } from '@/lib/chat/chatAttachmentUpload';
import type { IMessageDTO } from "@esparex/contracts";

export { shouldMarkConversationRead };

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
  sendMessage: (text: string, attachmentFile?: File) => Promise<boolean>;
  retryFailedMessage: (tempId: string) => Promise<boolean>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  /** True when a loadMore() is in progress (prepends older msgs — don't auto-scroll) */
  isLoadingMore: boolean;
  retry: () => Promise<void>;
  isOtherTyping: boolean;
  isCounterpartyOnline: boolean;
  sendTyping: (receiverId: string, isTyping: boolean) => void;
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

  const latestCreatedAtRef = useRef<string | undefined>(undefined);
  const onConversationStateChangeRef = useRef(onConversationStateChange);

  useEffect(() => {
    onConversationStateChangeRef.current = onConversationStateChange;
  }, [onConversationStateChange]);

  const { socketConnected, isOtherTyping, isCounterpartyOnline, sendTyping } = useChatSocketEngine({
    conversationId,
    currentUserId,
    counterpartyUserId,
    setMessages,
    latestCreatedAtRef,
  });

  useChatPollingEngine({
    conversationId,
    currentUserId,
    socketConnected,
    latestCreatedAtRef,
    onConversationStateChangeRef,
    setMessages,
  });

  /* Initial load */
  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await chatApi.messages(conversationId);
      const rawMsgs = res.data ?? [];
      const msgs = rawMsgs.map((m) => withDeliveryStatus(m, currentUserId));
      const seen = new Set<string>();
      const uniqueMsgs = msgs.filter((m) => {
        if (!m.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      setMessages(uniqueMsgs);
      setHasMore(!!res.nextCursor);
      setOldestCursor(res.nextCursor);
      if (uniqueMsgs.length > 0) {
        latestCreatedAtRef.current = uniqueMsgs[uniqueMsgs.length - 1]?.createdAt;
      } else {
        latestCreatedAtRef.current = undefined;
      }
      if (shouldMarkConversationRead(uniqueMsgs, currentUserId)) {
        await chatApi.markRead(conversationId).catch(() => {});
        dispatchChatInboxUpdated();
      }
    } catch {
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId]);

  /* Load more (older messages) */
  const loadMore = useCallback(async () => {
    if (!hasMore || !oldestCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const res = await chatApi.messages(conversationId, oldestCursor);
      const olderRaw = res.data ?? [];
      const older = olderRaw.map((m) => withDeliveryStatus(m, currentUserId));
      setMessages((prev) => {
        const map = new Map<string, IMessageDTO>();
        for (const m of older) if (m.id) map.set(m.id, m);
        for (const m of prev) if (m.id) map.set(m.id, m);
        return Array.from(map.values());
      });
      setHasMore(!!res.nextCursor);
      setOldestCursor(res.nextCursor);
    } catch {
      setError('Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, currentUserId, hasMore, oldestCursor, isLoadingMore]);

  /* Send a new message with optimistic UI rendering */
  const sendMessage = useCallback(
    async (text: string, attachmentFile?: File) => {
      const trimmed = text.trim();
      if (!trimmed && !attachmentFile) return false;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const optimisticMsg: IMessageDTO = {
        id: tempId,
        tempId,
        conversationId,
        senderId: currentUserId,
        text: trimmed,
        deliveryStatus: 'sending',
        createdAt: nowIso,
        attachments: attachmentFile
          ? [
              {
                url: URL.createObjectURL(attachmentFile),
                displayUrl: URL.createObjectURL(attachmentFile),
                mimeType: attachmentFile.type,
                size: attachmentFile.size,
                name: attachmentFile.name,
                status: 'available' as const,
              },
            ]
          : undefined,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setIsSending(true);
      setError(null);

      try {
        const attachments = attachmentFile
          ? await uploadChatAttachment(conversationId, attachmentFile)
          : undefined;

        const res = await chatApi.send({ conversationId, text: trimmed, attachments });
        const confirmed: IMessageDTO = {
          ...res.message,
          deliveryStatus: res.message.readAt ? 'read' : 'sent',
        };

        setMessages((prev) => {
          // If socket already replaced or added the message with confirmed ID, remove any leftover temp entry
          const alreadyHasConfirmed = prev.some((m) => m.id === confirmed.id && m.id !== tempId);
          if (alreadyHasConfirmed) {
            return prev.filter((m) => m.id !== tempId && m.tempId !== tempId);
          }
          return prev.map((m) => (m.id === tempId || m.tempId === tempId ? confirmed : m));
        });
        latestCreatedAtRef.current = confirmed.createdAt;
        dispatchChatInboxUpdated();
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error && err.message
          ? err.message
          : 'Failed to send message';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId || m.tempId === tempId
              ? { ...m, deliveryStatus: 'failed' }
              : m
          )
        );
        setError(errorMessage);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, currentUserId]
  );

  /* Retry a failed message */
  const retryFailedMessage = useCallback(
    async (tempId: string) => {
      const failedMsg = messages.find((m) => m.id === tempId || m.tempId === tempId);
      if (!failedMsg || failedMsg.deliveryStatus !== 'failed') return false;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId || m.tempId === tempId
            ? { ...m, deliveryStatus: 'sending' }
            : m
        )
      );

      try {
        const res = await chatApi.send({
          conversationId,
          text: failedMsg.text,
          attachments: failedMsg.attachments,
        });
        const confirmed: IMessageDTO = {
          ...res.message,
          deliveryStatus: res.message.readAt ? 'read' : 'sent',
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId || m.tempId === tempId ? confirmed : m))
        );
        latestCreatedAtRef.current = confirmed.createdAt;
        dispatchChatInboxUpdated();
        return true;
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId || m.tempId === tempId
              ? { ...m, deliveryStatus: 'failed' }
              : m
          )
        );
        return false;
      }
    },
    [conversationId, messages]
  );

  /* Initial load */
  useEffect(() => {
    latestCreatedAtRef.current = undefined;
    void (async () => { await loadInitial(); })();
  }, [loadInitial]);

  return {
    messages,
    isLoading,
    isSending,
    isLoadingMore,
    error,
    sendMessage,
    retryFailedMessage,
    loadMore,
    hasMore,
    retry: loadInitial,
    isOtherTyping,
    isCounterpartyOnline,
    sendTyping,
  };
}
