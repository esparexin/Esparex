import { AuthServiceImpl } from '../AuthServiceImpl';
import { ITokenStorage } from '../ITokenStorage';
import { AxiosInstance } from 'axios';

describe('AuthServiceImpl', () => {
  let mockApiClient: { post: jest.Mock };
  let mockTokenStorage: jest.Mocked<ITokenStorage>;
  let authService: AuthServiceImpl;

  beforeEach(() => {
    mockApiClient = {
      post: jest.fn(),
    };

    mockTokenStorage = {
      setAccessToken: jest.fn().mockResolvedValue(undefined),
      getAccessToken: jest.fn().mockResolvedValue('test-access-token'),
      setTokens: jest.fn().mockResolvedValue(undefined),
      getTokens: jest.fn().mockResolvedValue({ accessToken: 'test-access-token', refreshToken: null }),
      clearTokens: jest.fn().mockResolvedValue(undefined),
      hasTokens: jest.fn().mockResolvedValue(true),
      isAvailable: jest.fn().mockResolvedValue(true),
    };

    authService = new AuthServiceImpl(mockApiClient as any, mockTokenStorage);
  });

  describe('sendOtp()', () => {
    it('should call /auth/send-otp with normalized mobile and return response', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            success: true,
            isNewUser: false,
            otpExpiresIn: 300,
            name: 'Kalyan'
          }
        }
      });

      const result = await authService.sendOtp('9876543210');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/send-otp', { mobile: '9876543210' });
      expect(result).toEqual({
        success: true,
        isNewUser: false,
        otpExpiresIn: 300,
        name: 'Kalyan',
        message: 'OTP sent successfully'
      });
    });

    it('should handle new user flag correctly from backend', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            success: true,
            isNewUser: true,
            otpExpiresIn: 300
          }
        }
      });

      const result = await authService.sendOtp('9876543210');

      expect(result.isNewUser).toBe(true);
    });
  });

  describe('verifyOtp()', () => {
    it('should verify OTP for existing user and persist access token to storage', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            success: true,
            token: 'jwt-token-xyz',
            user: {
              _id: 'user-123',
              mobile: '+919876543210',
              name: 'Kalyan'
            }
          }
        }
      });

      const result = await authService.verifyOtp('9876543210', '123456');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/verify-otp', {
        mobile: '9876543210',
        otp: '123456'
      });
      expect(mockTokenStorage.setAccessToken).toHaveBeenCalledWith('jwt-token-xyz');
      expect(result.userId).toBe('user-123');
      expect(result.accessToken).toBe('jwt-token-xyz');
    });

    it('should pass name when registering a new user', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            success: true,
            token: 'jwt-token-new',
            isNewUser: true,
            user: {
              _id: 'user-456',
              mobile: '+919876543210',
              name: 'John Doe'
            }
          }
        }
      });

      const result = await authService.verifyOtp('9876543210', '123456', 'John Doe');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/verify-otp', {
        mobile: '9876543210',
        otp: '123456',
        name: 'John Doe'
      });
      expect(mockTokenStorage.setAccessToken).toHaveBeenCalledWith('jwt-token-new');
      expect(result.userId).toBe('user-456');
    });
  });

  describe('cancelOtp()', () => {
    it('should call /auth/cancel-otp with mobile number', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true } });

      await authService.cancelOtp('9876543210');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/cancel-otp', { mobile: '9876543210' });
    });
  });

  describe('logout()', () => {
    it('should call logout endpoint and clear tokens from storage', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true } });

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if logout endpoint throws error', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });
  });
});
