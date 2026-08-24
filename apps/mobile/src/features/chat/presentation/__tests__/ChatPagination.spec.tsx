import { mergePaginatedMessages, reconcileOptimisticMessage } from '../../domain/chatPagination';
import type { IMessageDTO } from '@esparex/contracts';

describe('Mobile Chat Pagination & Offline Queue Reconciliation', () => {
  it('correctly merges paginated historical messages without duplicates in chronological order', () => {
    const currentMessages: IMessageDTO[] = [
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        senderId: 'user-1',
        text: 'Third message',
        createdAt: '2026-08-23T10:05:00.000Z',
      },
      {
        id: 'msg-4',
        conversationId: 'conv-1',
        senderId: 'user-2',
        text: 'Fourth message',
        createdAt: '2026-08-23T10:10:00.000Z',
      },
    ];

    const olderMessages: IMessageDTO[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        text: 'First message',
        createdAt: '2026-08-23T09:50:00.000Z',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'user-2',
        text: 'Second message',
        createdAt: '2026-08-23T10:00:00.000Z',
      },
      // Overlapping message with currentMessages
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        senderId: 'user-1',
        text: 'Third message',
        createdAt: '2026-08-23T10:05:00.000Z',
      },
    ];

    const merged = mergePaginatedMessages(currentMessages, olderMessages);

    expect(merged).toHaveLength(4);
    expect(merged.map((m) => m.id)).toEqual(['msg-1', 'msg-2', 'msg-3', 'msg-4']);
  });

  it('reconciles optimistic temporary message with server-confirmed message', () => {
    const tempId = 'temp-msg-123';
    const optimisticList: IMessageDTO[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        text: 'Hello',
        createdAt: '2026-08-23T10:00:00.000Z',
      },
      {
        id: tempId,
        tempId,
        conversationId: 'conv-1',
        senderId: 'user-1',
        text: 'Is this available?',
        createdAt: '2026-08-23T10:01:00.000Z',
        deliveryStatus: 'sending',
      },
    ];

    const serverConfirmed: IMessageDTO = {
      id: 'real-msg-999',
      conversationId: 'conv-1',
      senderId: 'user-1',
      text: 'Is this available?',
      createdAt: '2026-08-23T10:01:02.000Z',
      deliveryStatus: 'sent',
    };

    const reconciled = reconcileOptimisticMessage(optimisticList, tempId, serverConfirmed);

    expect(reconciled).toHaveLength(2);
    expect(reconciled[1]?.id).toBe('real-msg-999');
    expect(reconciled[1]?.deliveryStatus).toBe('sent');
  });
});
