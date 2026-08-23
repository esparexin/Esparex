import { AppNotification } from '../domain/Notification';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { INotificationRepository } from './INotificationRepository';

export class ApiNotificationRepository implements INotificationRepository {
  async getNotifications(): Promise<AppNotification[]> {
    const response = await apiClient.get<AppNotification[]>('/notifications');
    return response.data;
  }

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  }

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/all/read');
  }
}
