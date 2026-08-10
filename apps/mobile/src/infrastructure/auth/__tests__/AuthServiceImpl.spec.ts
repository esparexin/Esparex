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
      setTokens: jest.fn(),
      getTokens: jest.fn(),
      clearTokens: jest.fn(),
      hasTokens: jest.fn(),
      isAvailable: jest.fn(),
    };

    authService = new AuthServiceImpl(mockApiClient as any, mockTokenStorage);
  });

  describe('login()', () => {
    it('should map backend DTO to Domain AuthResult and store tokens', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          accessToken: 'test-access',
          refreshToken: 'test-refresh',
          userId: 'user-123'
        }
      });

      const result = await authService.login({ email: 'test@example.com', password: 'password' });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/auth/login', { email: 'test@example.com', password: 'password' });
      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith('test-access', 'test-refresh');
      expect(result).toEqual({ userId: 'user-123' });
    });

    it('should handle missing tokens gracefully', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          userId: 'user-123'
        }
      });

      const result = await authService.login({ email: 'test@example.com' });

      expect(mockTokenStorage.setTokens).not.toHaveBeenCalled();
      expect(result).toEqual({ userId: 'user-123' });
    });
  });

  describe('logout()', () => {
    it('should call logout endpoint and clear tokens', async () => {
      mockApiClient.post.mockResolvedValue({});

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/auth/logout');
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if logout endpoint fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/auth/logout');
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });
  });

  describe('executeTokenRefresh()', () => {
    it('should refresh tokens and save new tokens', async () => {
      mockTokenStorage.getTokens.mockResolvedValue({
        accessToken: 'old-access',
        refreshToken: 'old-refresh'
      });

      mockApiClient.post.mockResolvedValue({
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh'
        }
      });

      const newAccessToken = await authService.executeTokenRefresh();

      expect(mockTokenStorage.getTokens).toHaveBeenCalled();
      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/auth/refresh', {
        refreshToken: 'old-refresh'
      });
      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
      expect(newAccessToken).toBe('new-access');
    });

    it('should fallback to old refresh token if new one is not provided', async () => {
      mockTokenStorage.getTokens.mockResolvedValue({
        accessToken: 'old-access',
        refreshToken: 'old-refresh'
      });

      mockApiClient.post.mockResolvedValue({
        data: {
          accessToken: 'new-access',
          // no new refresh token
        }
      });

      const newAccessToken = await authService.executeTokenRefresh();

      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith('new-access', 'old-refresh');
      expect(newAccessToken).toBe('new-access');
    });

    it('should throw if no refresh token is available', async () => {
      mockTokenStorage.getTokens.mockResolvedValue({
        accessToken: 'old-access',
        refreshToken: null
      });

      await expect(authService.executeTokenRefresh()).rejects.toThrow('No refresh token available');
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should clear tokens and re-throw if refresh API call fails', async () => {
      mockTokenStorage.getTokens.mockResolvedValue({
        accessToken: 'old-access',
        refreshToken: 'old-refresh'
      });

      mockApiClient.post.mockRejectedValue(new Error('Invalid refresh token'));

      await expect(authService.executeTokenRefresh()).rejects.toThrow('Invalid refresh token');
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens if refresh response contains no access token', async () => {
      mockTokenStorage.getTokens.mockResolvedValue({
        accessToken: 'old-access',
        refreshToken: 'old-refresh'
      });

      mockApiClient.post.mockResolvedValue({
        data: {}
      });

      await expect(authService.executeTokenRefresh()).rejects.toThrow('No access token returned from refresh endpoint');
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });
  });
});
