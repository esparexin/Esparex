import { NotificationTypeValue } from '@esparex/contracts';

export interface AppNotification {
  id: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}
