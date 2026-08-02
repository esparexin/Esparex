import * as Notifications from 'expo-notifications';
import { ExpoPushNotificationEventService } from '../ExpoPushNotificationEventService';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(),
}));

const mockSetHandler = Notifications.setNotificationHandler as jest.Mock;
const mockAddReceived = Notifications.addNotificationReceivedListener as jest.Mock;
const mockAddResponse = Notifications.addNotificationResponseReceivedListener as jest.Mock;
const mockSetBadge = Notifications.setBadgeCountAsync as jest.Mock;
const mockGetBadge = Notifications.getBadgeCountAsync as jest.Mock;

describe('ExpoPushNotificationEventService', () => {
  let service: ExpoPushNotificationEventService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExpoPushNotificationEventService();
  });

  describe('configureNotificationHandler', () => {
    it('configures Expo notification handler rules', () => {
      service.configureNotificationHandler();

      expect(mockSetHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });
    });
  });

  describe('addNotificationReceivedListener', () => {
    it('subscribes to Expo notification received and maps payload to domain model', () => {
      const mockRemove = jest.fn();
      let capturedCallback: (event: any) => void = () => {};

      mockAddReceived.mockImplementation((cb) => {
        capturedCallback = cb;
        return { remove: mockRemove };
      });

      const listenerSpy = jest.fn();
      const unsubscribe = service.addNotificationReceivedListener(listenerSpy);

      capturedCallback({
        request: {
          identifier: 'notif-123',
          content: {
            title: 'New Message',
            body: 'Hello world',
            data: { conversationId: 'conv-1' },
          },
        },
      });

      expect(listenerSpy).toHaveBeenCalledWith({
        id: 'notif-123',
        title: 'New Message',
        body: 'Hello world',
        data: { conversationId: 'conv-1' },
      });

      unsubscribe();
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('addNotificationResponseReceivedListener', () => {
    it('subscribes to Expo response received and maps response to domain model', () => {
      const mockRemove = jest.fn();
      let capturedCallback: (event: any) => void = () => {};

      mockAddResponse.mockImplementation((cb) => {
        capturedCallback = cb;
        return { remove: mockRemove };
      });

      const listenerSpy = jest.fn();
      const unsubscribe = service.addNotificationResponseReceivedListener(listenerSpy);

      capturedCallback({
        actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
        notification: {
          request: {
            identifier: 'notif-456',
            content: {
              title: 'Ad Approved',
              body: 'Your ad is live',
              data: { listingId: 'ad-99' },
            },
          },
        },
      });

      expect(listenerSpy).toHaveBeenCalledWith({
        actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
        notification: {
          id: 'notif-456',
          title: 'Ad Approved',
          body: 'Your ad is live',
          data: { listingId: 'ad-99' },
        },
      });

      unsubscribe();
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('badge management', () => {
    it('sets badge count successfully', async () => {
      mockSetBadge.mockResolvedValue(true);

      const result = await service.setBadgeCount(5);

      expect(result).toBe(true);
      expect(mockSetBadge).toHaveBeenCalledWith(5);
    });

    it('returns false gracefully when setBadgeCount fails', async () => {
      mockSetBadge.mockRejectedValue(new Error('SDK error'));

      const result = await service.setBadgeCount(-1);

      expect(result).toBe(false);
    });

    it('gets badge count successfully', async () => {
      mockGetBadge.mockResolvedValue(3);

      const count = await service.getBadgeCount();

      expect(count).toBe(3);
    });
  });
});
