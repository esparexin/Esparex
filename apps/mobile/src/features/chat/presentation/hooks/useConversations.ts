import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';
import { useAuth } from '../../../../providers/AuthProvider';

export const useConversations = () => {
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  return useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: async () => {
      return await services.chatService.getConversations();
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnMount: true, // unread counts per conversation must be fresh on chat tab entry
  });
};

export const useUnreadChatCount = (): number => {
  const { data: conversations } = useConversations();
  if (!Array.isArray(conversations)) return 0;
  return conversations.reduce((total, conv) => {
    return total + (conv.unreadBuyer || 0) + (conv.unreadSeller || 0);
  }, 0);
};
