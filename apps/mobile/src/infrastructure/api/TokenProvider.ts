import { SecureStoreAdapter } from '../auth/SecureStoreAdapter';

/**
 * An abstraction layer that provides the API client with access to authentication tokens.
 * This decouples the networking layer from the concrete storage implementation.
 */
export const TokenProvider = {
  /**
   * Retrieves the current access token.
   */
  async getAccessToken(): Promise<string | null> {
    const { accessToken } = await SecureStoreAdapter.getTokens();
    return accessToken;
  },

  /**
   * Retrieves the current refresh token.
   */
  async getRefreshToken(): Promise<string | null> {
    const { refreshToken } = await SecureStoreAdapter.getTokens();
    return refreshToken;
  }
};
