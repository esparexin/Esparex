import { AxiosInstance } from 'axios';
import { IAuthService, AuthResult, SendOtpResult } from './AuthService';
import { ITokenStorage } from './ITokenStorage';
import { IPushTokenRegistrationService } from '../../features/notifications/application/IPushTokenRegistrationService';

export class AuthServiceImpl implements IAuthService {
  constructor(
    private readonly apiClient: AxiosInstance,
    private readonly tokenStorage: ITokenStorage,
    private readonly pushTokenRegistrationService?: IPushTokenRegistrationService
  ) {}

  async sendOtp(mobile: string): Promise<SendOtpResult> {
    const response = await this.apiClient.post('/auth/send-otp', { mobile: mobile.trim() });
    const data = response.data?.data || response.data;
    return {
      success: response.data?.success ?? true,
      isNewUser: Boolean(data?.isNewUser),
      otpExpiresIn: typeof data?.otpExpiresIn === 'number' ? data.otpExpiresIn : 300,
      name: data?.name,
      message: response.data?.message || 'OTP sent successfully',
    };
  }

  async verifyOtp(mobile: string, otp: string, name?: string): Promise<AuthResult> {
    const payload: { mobile: string; otp: string; name?: string } = {
      mobile: mobile.trim(),
      otp: otp.trim(),
    };
    if (name && name.trim()) {
      payload.name = name.trim();
    }

    const response = await this.apiClient.post('/auth/verify-otp', payload);
    const data = response.data?.data || response.data;
    const accessToken =
      data?.token ||
      data?.accessToken ||
      data?.user?.accessToken ||
      response.data?.token ||
      response.data?.accessToken;
    const userId =
      data?.user?._id ||
      data?.user?.id ||
      data?.userId ||
      'unknown-user';

    if (accessToken) {
      await this.tokenStorage.setAccessToken(accessToken);
    }

    if (this.pushTokenRegistrationService) {
      try {
        await this.pushTokenRegistrationService.registerPushToken();
      } catch {
        // Non-blocking: push token registration failure does not fail auth
      }
    }

    return {
      userId,
      accessToken: accessToken || '',
      isNewUser: data?.isNewUser,
      user: data?.user,
    };
  }

  async cancelOtp(mobile: string): Promise<void> {
    try {
      await this.apiClient.post('/auth/cancel-otp', { mobile: mobile.trim() });
    } catch {
      // Non-blocking: best-effort OTP invalidation
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.pushTokenRegistrationService) {
        await this.pushTokenRegistrationService.unregisterPushToken().catch(() => {});
      }
      await this.apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout, we still want to clear the local session
    } finally {
      await this.tokenStorage.clearTokens();
    }
  }
}
