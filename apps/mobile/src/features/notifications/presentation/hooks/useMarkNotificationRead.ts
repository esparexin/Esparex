import { useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';
import { AppNotification } from '../../domain/Notification';

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id?: string) => {
      if (id) {
        await services.notificationService.markRead(id);
      } else {
        await services.notificationService.markAllRead();
      }
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<AppNotification[]>(['notifications'], (old = []) => {
        if (!id) {
          return old.map((n) => ({ ...n, isRead: true }));
        }
        return old.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
