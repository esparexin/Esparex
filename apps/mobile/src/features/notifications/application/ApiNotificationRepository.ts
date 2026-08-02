import { AppNotification } from '../domain/Notification';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { INotificationRepository } from './INotificationRepository';

export class ApiNotificationRepository implements INotificationRepository {
  async getNotifications(): Promise<AppNotification[]> {
    const response = await apiClient.get<AppNotification[]>('/api/v1/notifications');
    return response.data;
  }

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/api/v1/notifications/${id}/read`);
  }

  async markAllRead(): Promise<void> {
    await apiClient.patch('/api/v1/notifications/all/read');
  }
}
