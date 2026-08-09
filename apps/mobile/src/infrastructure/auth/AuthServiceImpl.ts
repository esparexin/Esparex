import { AxiosInstance } from 'axios';
import { IAuthService, AuthResult } from './AuthService';
import { ITokenStorage } from './ITokenStorage';
import { IPushTokenRegistrationService } from '../../features/notifications/application/IPushTokenRegistrationService';

export class AuthServiceImpl implements IAuthService {
  constructor(
    private readonly apiClient: AxiosInstance,
    private readonly tokenStorage: ITokenStorage,
    private readonly pushTokenRegistrationService?: IPushTokenRegistrationService
  ) {
    // Bind the executeTokenRefresh context so it can be passed freely
    this.executeTokenRefresh = this.executeTokenRefresh.bind(this);
  }

  async login(payload: unknown): Promise<AuthResult> {
    const response = await this.apiClient.post('/v1/auth/login', payload);
    const data = response.data?.data || response.data;
    const accessToken = data?.accessToken || response.data?.accessToken;
    const refreshToken = data?.refreshToken || response.data?.refreshToken;
    const userId = data?.userId || data?.user?._id || 'unknown-user';

    if (accessToken && refreshToken) {
      await this.tokenStorage.setTokens(accessToken, refreshToken);
    }

    if (this.pushTokenRegistrationService) {
      await this.pushTokenRegistrationService.registerPushToken();
    }

    return {
      userId,
    };
  }

  async sendOtp(mobile: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.apiClient.post('/v1/auth/send-otp', { mobile });
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || 'OTP sent successfully'
    };
  }

  async verifyOtp(mobile: string, otp: string): Promise<AuthResult> {
    const response = await this.apiClient.post('/v1/auth/verify-otp', { mobile, otp });
    const data = response.data?.data || response.data;
    const accessToken = data?.accessToken || response.data?.accessToken;
    const refreshToken = data?.refreshToken || response.data?.refreshToken;
    const userId = data?.userId || data?.user?._id || 'unknown-user';

    if (accessToken && refreshToken) {
      await this.tokenStorage.setTokens(accessToken, refreshToken);
    }

    if (this.pushTokenRegistrationService) {
      await this.pushTokenRegistrationService.registerPushToken();
    }

    return {
      userId,
    };
  }

  async logout(): Promise<void> {
    try {
      if (this.pushTokenRegistrationService) {
        await this.pushTokenRegistrationService.unregisterPushToken();
      } else {
        await this.apiClient.post('/v1/auth/logout');
      }
    } catch (e) {
      // Ignore network errors on logout, we still want to clear the local session
    } finally {
      await this.tokenStorage.clearTokens();
    }
  }

  async executeTokenRefresh(): Promise<string> {
    const tokens = await this.tokenStorage.getTokens();
    
    if (!tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.apiClient.post('/v1/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });

      const newAccessToken = response.data?.accessToken;
      const newRefreshToken = response.data?.refreshToken;

      if (!newAccessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }

      await this.tokenStorage.setTokens(
        newAccessToken, 
        newRefreshToken || tokens.refreshToken // Fallback to existing refresh token if not rotated
      );

      return newAccessToken;
    } catch (error) {
      // If refresh fails, clear tokens so the user is forced to log in again
      await this.tokenStorage.clearTokens();
      throw error;
    }
  }
}
