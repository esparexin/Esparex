'use client';

import { useEffect, useRef, useCallback, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
import { chatApi } from '@/lib/api/chatApi';
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import { withDeliveryStatus, shouldMarkConversationRead } from './useChatSocketEngine';
import type { IMessageDTO } from '@esparex/contracts';

const POLL_ACTIVE_MS = 4000;
const POLL_FALLBACK_MS = 30000;

interface UseChatPollingEngineOptions {
  conversationId: string;
  currentUserId: string;
  socketConnected: boolean;
  latestCreatedAtRef: MutableRefObject<string | undefined>;
  onConversationStateChangeRef: MutableRefObject<((state: { isAdClosed: boolean; isBlocked: boolean }) => void) | undefined>;
  setMessages: Dispatch<SetStateAction<IMessageDTO[]>>;
}

export function useChatPollingEngine({
  conversationId,
  currentUserId,
  socketConnected,
  latestCreatedAtRef,
  onConversationStateChangeRef,
  setMessages,
}: UseChatPollingEngineOptions) {
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

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
      const rawMsgs = res.data ?? [];
      const newMsgs = rawMsgs.map((m) => withDeliveryStatus(m, currentUserId));
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
  }, [conversationId, currentUserId, latestCreatedAtRef, onConversationStateChangeRef, setMessages]);

  useEffect(() => {
    pollCountRef.current = 0;
    const intervalMs = socketConnected ? POLL_FALLBACK_MS : POLL_ACTIVE_MS;
    pollerRef.current = setInterval(poll, intervalMs);
    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    };
  }, [poll, socketConnected]);

  return { pollCountRef };
}
