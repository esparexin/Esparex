import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await services.notificationService.getNotifications();
    },
    staleTime: 1000 * 30, // 30s
    refetchOnMount: true, // unread count drives OS badge — always refresh on mount
  });
};

export const useUnreadNotificationsCount = () => {
  const { data: notifications = [] } = useNotifications();
  if (!Array.isArray(notifications)) return 0;
  return notifications.filter((n) => !n.isRead).length;
};
