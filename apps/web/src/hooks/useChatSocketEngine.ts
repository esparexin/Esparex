'use client';

import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
import { chatApi } from '@/lib/api/chatApi';
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import {
  getChatSocket,
  emitChatTyping,
  queryPresenceStatus,
  type IChatMessageEvent,
  type IChatReadEvent,
  type IChatTypingEvent,
} from '@/lib/chatSocket';
import type { IMessageDTO } from '@esparex/contracts';

interface UseChatSocketEngineOptions {
  conversationId: string;
  currentUserId: string;
  counterpartyUserId?: string;
  setMessages: Dispatch<SetStateAction<IMessageDTO[]>>;
  latestCreatedAtRef: MutableRefObject<string | undefined>;
}

export function shouldMarkConversationRead(
  messages: IMessageDTO[],
  currentUserId: string
): boolean {
  return messages.some((message) => message.senderId !== currentUserId && !message.readAt);
}

export function withDeliveryStatus(msg: IMessageDTO, currentUserId: string): IMessageDTO {
  if (msg.deliveryStatus) return msg;
  if (msg.senderId !== currentUserId) return msg;
  return {
    ...msg,
    deliveryStatus: msg.readAt ? 'read' : 'sent',
  };
}

export function useChatSocketEngine({
  conversationId,
  currentUserId,
  counterpartyUserId,
  setMessages,
  latestCreatedAtRef,
}: UseChatSocketEngineOptions) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isCounterpartyOnline, setIsCounterpartyOnline] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendTyping = useCallback((receiverId: string, isTyping: boolean) => {
    if (!receiverId || !conversationId) return;
    emitChatTyping(conversationId, receiverId, isTyping);
  }, [conversationId]);

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
      const incomingMsg = withDeliveryStatus(data.message, currentUserId);
      setMessages((prev) => {
        // 1. Check if message already exists by real ID
        const existsById = prev.some((m) => m.id === incomingMsg.id);
        if (existsById) {
          return prev.map((m) => (m.id === incomingMsg.id ? incomingMsg : m));
        }

        // 2. If it's our own message, reconcile with in-flight optimistic temp message
        if (incomingMsg.senderId === currentUserId) {
          const tempIndex = prev.findIndex(
            (m) =>
              (m.id.startsWith('temp-') || m.tempId) &&
              m.senderId === currentUserId &&
              m.text === incomingMsg.text
          );
          if (tempIndex !== -1) {
            const next = [...prev];
            next[tempIndex] = incomingMsg;
            return next;
          }
        }

        return [...prev, incomingMsg];
      });
      latestCreatedAtRef.current = incomingMsg.createdAt;
      if (incomingMsg.senderId !== currentUserId) {
        setIsOtherTyping(false);
        void chatApi.markRead(conversationId).catch(() => {});
        dispatchChatInboxUpdated();
      }
    };

    const handleChatRead = (data: IChatReadEvent) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === currentUserId
            ? { ...msg, readAt: data.readAt, deliveryStatus: 'read' }
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
  }, [conversationId, currentUserId, counterpartyUserId, setMessages, latestCreatedAtRef]);

  return {
    socketConnected,
    isOtherTyping,
    isCounterpartyOnline,
    sendTyping,
  };
}
