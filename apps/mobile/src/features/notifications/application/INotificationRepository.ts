import { AppNotification } from '../domain/Notification';

export interface INotificationRepository {
  getNotifications(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}
