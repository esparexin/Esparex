import { useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';
import type { IMessageDTO, MobileChatSendMessagePayload as SendMessagePayload } from '@esparex/contracts';

/**
 * Phase 3a (§5): the local `SendMessagePayload` interface is relocated to
 * `@esparex/contracts` as `MobileChatSendMessagePayload` (canonical owner per
 * DECISION-GATE §3) and imported under its historic local name.
 *
 * CONFLICT (recorded, not merged): this shape
 * ({ conversationId, text, senderId?, tempId? }) collides by name with the
 * web's `SendMessagePayload` (`apps/web/src/lib/api/chatApi.ts:21`,
 * { conversationId, text, attachments? }); the web shape is canonicalized as
 * `ChatSendMessagePayload`. A future gate decision may unify them.
 */

interface MutationContext {
  tempId: string;
  previousMessages?: IMessageDTO[];
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<IMessageDTO, Error, SendMessagePayload, MutationContext>({
    onMutate: async ({ conversationId, text, senderId, tempId: providedTempId }) => {
      const queryKey = ['chat', 'thread', conversationId];
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<IMessageDTO[]>(queryKey);
      const tempId = providedTempId || `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const optimisticMsg: IMessageDTO = {
        id: tempId,
        tempId,
        conversationId,
        senderId: senderId || 'current-user',
        text,
        createdAt: new Date().toISOString(),
        deliveryStatus: 'sending',
      };

      queryClient.setQueryData<IMessageDTO[]>(queryKey, (old = []) => {
        const filtered = old.filter((m) => m.tempId !== tempId && m.id !== tempId);
        return [...filtered, optimisticMsg];
      });

      return { tempId, previousMessages };
    },

    mutationFn: async ({ conversationId, text }: SendMessagePayload) => {
      return await services.chatService.sendMessage(conversationId, text);
    },

    onError: (_err, { conversationId }, context) => {
      if (!context?.tempId) return;
      const queryKey = ['chat', 'thread', conversationId];

      queryClient.setQueryData<IMessageDTO[]>(queryKey, (old = []) =>
        old.map((m) =>
          m.tempId === context.tempId || m.id === context.tempId
            ? { ...m, deliveryStatus: 'failed' }
            : m
        )
      );
    },

    onSuccess: (newMessage, { conversationId }, context) => {
      const queryKey = ['chat', 'thread', conversationId];

      queryClient.setQueryData<IMessageDTO[]>(queryKey, (old = []) => {
        const formattedNewMsg: IMessageDTO = {
          ...newMessage,
          deliveryStatus: newMessage.deliveryStatus || 'sent',
        };
        if (!context?.tempId) return [...old, formattedNewMsg];
        return old.map((m) =>
          m.tempId === context.tempId || m.id === context.tempId ? formattedNewMsg : m
        );
      });

      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};
