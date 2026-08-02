import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await services.notificationService.getNotifications();
    },
    staleTime: 1000 * 30, // 30s
  });
};

export const useUnreadNotificationsCount = () => {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter((n) => !n.isRead).length;
};
