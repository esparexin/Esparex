import { describe, expect, it } from 'vitest';
import type { IMessageDTO } from '@shared/contracts/chat.contracts';
import { shouldMarkConversationRead } from '@/hooks/useChat';

function makeMessage(overrides: Partial<IMessageDTO> = {}): IMessageDTO {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-2',
    text: 'hello',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('shouldMarkConversationRead', () => {
  it('returns true when there is an unread incoming message', () => {
    expect(
      shouldMarkConversationRead(
        [makeMessage({ senderId: 'user-2' })],
        'user-1'
      )
    ).toBe(true);
  });

  it('returns false for already-read incoming messages', () => {
    expect(
      shouldMarkConversationRead(
        [makeMessage({ senderId: 'user-2', readAt: new Date().toISOString() })],
        'user-1'
      )
    ).toBe(false);
  });

  it('returns false for the current users own messages', () => {
    expect(
      shouldMarkConversationRead(
        [makeMessage({ senderId: 'user-1' })],
        'user-1'
      )
    ).toBe(false);
  });
});
