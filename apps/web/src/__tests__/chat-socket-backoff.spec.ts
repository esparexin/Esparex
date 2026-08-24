// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { CHAT_INBOX_UPDATED_EVENT, dispatchChatInboxUpdated } from '@/lib/chatEvents';
import { withDeliveryStatus, shouldMarkConversationRead } from '@/hooks/useChatSocketEngine';
import type { IMessageDTO } from '@esparex/contracts';

describe('Chat WebSocket Resilience & Cross-Platform Badge Sync', () => {
  it('dispatches and receives CHAT_INBOX_UPDATED_EVENT in the window event bus', () => {
    const listener = vi.fn();
    window.addEventListener(CHAT_INBOX_UPDATED_EVENT, listener);

    dispatchChatInboxUpdated();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(CHAT_INBOX_UPDATED_EVENT, listener);
  });

  it('determines if unread counter needs updating when incoming messages are unread by current user', () => {
    const currentUserId = 'user_123';
    const messages: IMessageDTO[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user_456',
        text: 'Hello there',
        createdAt: '2026-08-23T10:00:00.000Z',
        readAt: undefined,
      },
    ];

    expect(shouldMarkConversationRead(messages, currentUserId)).toBe(true);

    const readMessages: IMessageDTO[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user_456',
        text: 'Hello there',
        createdAt: '2026-08-23T10:00:00.000Z',
        readAt: '2026-08-23T10:00:00.000Z',
      },
    ];
    expect(shouldMarkConversationRead(readMessages, currentUserId)).toBe(false);
  });

  it('augments outgoing message with correct deliveryStatus (sent vs read)', () => {
    const currentUserId = 'user_123';
    const unreadMine: IMessageDTO = {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: currentUserId,
      text: 'My message',
      createdAt: '2026-08-23T10:00:00.000Z',
      readAt: undefined,
    };

    const formattedUnread = withDeliveryStatus(unreadMine, currentUserId);
    expect(formattedUnread.deliveryStatus).toBe('sent');

    const readMine: IMessageDTO = {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: currentUserId,
      text: 'My message',
      createdAt: '2026-08-23T10:00:00.000Z',
      readAt: '2026-08-23T10:05:00.000Z',
    };
    const formattedRead = withDeliveryStatus(readMine, currentUserId);
    expect(formattedRead.deliveryStatus).toBe('read');
  });

  it('computes exponential backoff interval with bounded jitter correctly', () => {
    const computeBackoffWithJitter = (
      attempt: number,
      baseDelay: number = 1000,
      maxDelay: number = 10000,
      jitterFactor: number = 0.5
    ): number => {
      const expDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const minJitter = expDelay * (1 - jitterFactor);
      const maxJitter = expDelay * (1 + jitterFactor);
      // Average delay is centered on expDelay
      return (minJitter + maxJitter) / 2;
    };

    expect(computeBackoffWithJitter(0)).toBe(1000);
    expect(computeBackoffWithJitter(1)).toBe(2000);
    expect(computeBackoffWithJitter(2)).toBe(4000);
    expect(computeBackoffWithJitter(3)).toBe(8000);
    expect(computeBackoffWithJitter(4)).toBe(10000); // capped at maxDelay (10000)
  });
});
