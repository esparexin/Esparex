import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

export const useChatThread = (conversationId: string) => {
  return useQuery({
    queryKey: ['chat', 'thread', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return await services.chatService.getMessages(conversationId);
    },
    enabled: Boolean(conversationId),
    refetchInterval: 5000, // 5s polling fallback for real-time messages
  });
};
