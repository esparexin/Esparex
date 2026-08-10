import { Platform } from 'react-native';
import { AxiosInstance } from 'axios';
import { ApiPushTokenRegistrationService } from '../ApiPushTokenRegistrationService';
import { IPushNotificationService } from '../../application/IPushNotificationService';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('ApiPushTokenRegistrationService', () => {
  let pushNotificationService: jest.Mocked<IPushNotificationService>;
  let apiClient: { post: jest.Mock };
  let service: ApiPushTokenRegistrationService;

  beforeEach(() => {
    pushNotificationService = {
      requestPermission: jest.fn(),
      getExpoPushToken: jest.fn(),
      registerForPushNotifications: jest.fn(),
    };

    apiClient = {
      post: jest.fn(),
    };

    service = new ApiPushTokenRegistrationService(pushNotificationService, apiClient as any);
  });

  describe('registerPushToken', () => {
    it('successfully acquires token and posts payload to backend', async () => {
      pushNotificationService.registerForPushNotifications.mockResolvedValue({
        success: true,
        token: { value: 'ExponentPushToken[test-123]', platform: 'ios' },
      });

      apiClient.post.mockResolvedValue({ data: { success: true } });

      const result = await service.registerPushToken();

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith('/notifications/register', {
        token: 'ExponentPushToken[test-123]',
        platform: 'ios',
      });
    });

    it('returns false when push notification permission is denied', async () => {
      pushNotificationService.registerForPushNotifications.mockResolvedValue({
        success: false,
        reason: 'permission-denied',
      });

      const result = await service.registerPushToken();

      expect(result).toBe(false);
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('returns false gracefully when backend API call fails', async () => {
      pushNotificationService.registerForPushNotifications.mockResolvedValue({
        success: true,
        token: { value: 'ExponentPushToken[test-123]', platform: 'ios' },
      });

      apiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await service.registerPushToken();

      expect(result).toBe(false);
    });
  });

  describe('unregisterPushToken', () => {
    it('unregisters active token during logout', async () => {
      pushNotificationService.registerForPushNotifications.mockResolvedValue({
        success: true,
        token: { value: 'ExponentPushToken[test-123]', platform: 'ios' },
      });
      apiClient.post.mockResolvedValue({ data: { success: true } });

      await service.registerPushToken();

      const unregisterResult = await service.unregisterPushToken();

      expect(unregisterResult).toBe(true);
      expect(apiClient.post).toHaveBeenLastCalledWith('/auth/logout', {
        fcmToken: 'ExponentPushToken[test-123]',
      });
    });

    it('returns false when no token has been registered', async () => {
      const result = await service.unregisterPushToken();

      expect(result).toBe(false);
    });

    it('returns false gracefully if unregister API call fails', async () => {
      pushNotificationService.registerForPushNotifications.mockResolvedValue({
        success: true,
        token: { value: 'ExponentPushToken[test-123]', platform: 'ios' },
      });
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await service.registerPushToken();

      apiClient.post.mockRejectedValueOnce(new Error('Server error'));

      const result = await service.unregisterPushToken();

      expect(result).toBe(false);
    });
  });
});
