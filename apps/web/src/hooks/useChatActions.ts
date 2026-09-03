'use client';

import { useCallback } from 'react';
import { chatApi } from '@/lib/api/chatApi';
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import type { ChatReportReasonValue } from '@esparex/contracts';

export interface UseChatActionsOptions {
  conversationId?: string;
}

export function useChatActions(options?: UseChatActionsOptions) {
  const defaultConversationId = options?.conversationId;

  const block = useCallback(async (conversationId?: string) => {
    const id = conversationId || defaultConversationId;
    if (!id) throw new Error('Conversation ID required');
    const result = await chatApi.block(id);
    dispatchChatInboxUpdated();
    return result;
  }, [defaultConversationId]);

  const hide = useCallback(async (conversationId?: string) => {
    const id = conversationId || defaultConversationId;
    if (!id) throw new Error('Conversation ID required');
    const result = await chatApi.hide(id);
    dispatchChatInboxUpdated();
    return result;
  }, [defaultConversationId]);

  const unhide = useCallback(async (conversationId?: string) => {
    const id = conversationId || defaultConversationId;
    if (!id) throw new Error('Conversation ID required');
    const result = await chatApi.unhide(id);
    dispatchChatInboxUpdated();
    return result;
  }, [defaultConversationId]);

  const report = useCallback(async (params: {
    conversationId?: string;
    reason: ChatReportReasonValue;
    description?: string;
  }) => {
    const id = params.conversationId || defaultConversationId;
    if (!id) throw new Error('Conversation ID required');
    return chatApi.report({
      conversationId: id,
      reason: params.reason,
      description: params.description,
    });
  }, [defaultConversationId]);

  return { block, hide, unhide, report };
}
