import { Platform } from 'react-native';
import { AxiosInstance } from 'axios';
import { RegisterPushTokenRequestDTO } from '@esparex/contracts';
import { IPushNotificationService } from '../application/IPushNotificationService';
import { IPushTokenRegistrationService } from '../application/IPushTokenRegistrationService';

/**
 * ApiPushTokenRegistrationService
 *
 * Concrete infrastructure adapter for registering/unregistering device push tokens
 * with the Esparex backend API (`/api/v1/notifications/register`).
 */
export class ApiPushTokenRegistrationService implements IPushTokenRegistrationService {
  private currentToken: string | null = null;

  constructor(
    private readonly pushNotificationService: IPushNotificationService,
    private readonly apiClient: AxiosInstance
  ) {}

  async registerPushToken(): Promise<boolean> {
    try {
      const result = await this.pushNotificationService.registerForPushNotifications();
      if (!result.success) {
        return false;
      }

      const platform: 'android' | 'ios' | 'web' =
        Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      const payload: RegisterPushTokenRequestDTO = {
        token: result.token.value,
        platform: result.token.platform || platform,
      };

      await this.apiClient.post('/notifications/register', payload);
      this.currentToken = result.token.value;
      return true;
    } catch {
      // Fail-safe: push registration errors must not interrupt core app user flows
      return false;
    }
  }

  async unregisterPushToken(): Promise<boolean> {
    const tokenToUnregister = this.currentToken;
    this.currentToken = null;

    if (!tokenToUnregister) {
      return false;
    }

    try {
      await this.apiClient.post('/auth/logout', { fcmToken: tokenToUnregister });
      return true;
    } catch {
      // Fail-safe: unregistration failures on logout should not prevent session clearing
      return false;
    }
  }
}
