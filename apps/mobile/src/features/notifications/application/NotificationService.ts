import { AppNotification } from '../domain/Notification';
import { INotificationRepository } from './INotificationRepository';

export class NotificationService {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async getNotifications(): Promise<AppNotification[]> {
    return this.notificationRepository.getNotifications();
  }

  async markRead(id: string): Promise<void> {
    return this.notificationRepository.markRead(id);
  }

  async markAllRead(): Promise<void> {
    return this.notificationRepository.markAllRead();
  }
}
