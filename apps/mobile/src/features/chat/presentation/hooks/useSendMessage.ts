import { useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';
import { IMessageDTO } from '@esparex/contracts';

interface SendMessagePayload {
  conversationId: string;
  text: string;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, text }: SendMessagePayload) => {
      return await services.chatService.sendMessage(conversationId, text);
    },
    onSuccess: (newMessage, { conversationId }) => {
      queryClient.setQueryData<IMessageDTO[]>(['chat', 'thread', conversationId], (oldMessages = []) => [
        ...oldMessages,
        newMessage,
      ]);
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};
