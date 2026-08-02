import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

export const useConversations = () => {
  return useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: async () => {
      return await services.chatService.getConversations();
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};
