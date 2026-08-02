import { NotificationService } from '../NotificationService';
import { INotificationRepository } from '../INotificationRepository';
import { AppNotification } from '../../domain/Notification';

describe('NotificationService Unit Tests', () => {
  let mockRepo: jest.Mocked<INotificationRepository>;
  let notificationService: NotificationService;

  const sampleNotification: AppNotification = {
    id: 'notif-1',
    type: 'CHAT',
    title: 'New Message',
    body: 'You received a message.',
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockRepo = {
      getNotifications: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };
    notificationService = new NotificationService(mockRepo);
  });

  it('delegates getNotifications call to repository', async () => {
    mockRepo.getNotifications.mockResolvedValueOnce([sampleNotification]);

    const result = await notificationService.getNotifications();
    expect(result).toEqual([sampleNotification]);
    expect(mockRepo.getNotifications).toHaveBeenCalledTimes(1);
  });

  it('delegates markRead call to repository', async () => {
    mockRepo.markRead.mockResolvedValueOnce(undefined);

    await notificationService.markRead('notif-1');
    expect(mockRepo.markRead).toHaveBeenCalledWith('notif-1');
  });

  it('delegates markAllRead call to repository', async () => {
    mockRepo.markAllRead.mockResolvedValueOnce(undefined);

    await notificationService.markAllRead();
    expect(mockRepo.markAllRead).toHaveBeenCalledTimes(1);
  });
});
