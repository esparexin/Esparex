import { AxiosInstance } from 'axios';
import { IAuthService, AuthResult } from './AuthService';
import { ITokenStorage } from './ITokenStorage';

export class AuthServiceImpl implements IAuthService {
  constructor(
    private readonly apiClient: AxiosInstance,
    private readonly tokenStorage: ITokenStorage
  ) {
    // Bind the executeTokenRefresh context so it can be passed freely
    this.executeTokenRefresh = this.executeTokenRefresh.bind(this);
  }

  async login(payload: unknown): Promise<AuthResult> {
    const response = await this.apiClient.post('/auth/login', payload);
    
    // Ensure we handle cases where the token might not be returned immediately,
    // though the contract implies it will be in the response body.
    const accessToken = response.data?.accessToken;
    const refreshToken = response.data?.refreshToken;
    const userId = response.data?.userId || 'unknown-user';

    if (accessToken && refreshToken) {
      await this.tokenStorage.setTokens(accessToken, refreshToken);
    }

    // Map backend DTO to Domain AuthResult
    return {
      userId,
    };
  }

  async logout(): Promise<void> {
    try {
      await this.apiClient.post('/auth/logout');
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
      const response = await this.apiClient.post('/auth/refresh', {
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
