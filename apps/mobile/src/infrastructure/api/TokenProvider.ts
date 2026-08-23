import { SecureStoreAdapter } from '../auth/SecureStoreAdapter';

let cachedAccessToken: string | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * An abstraction layer that provides the API client with access to authentication tokens.
 * This decouples the networking layer from the concrete storage implementation.
 */
export const TokenProvider = {
  /**
   * Retrieves the current access token.
   */
  async getAccessToken(): Promise<string | null> {
    const now = Date.now();
    if (cachedAccessToken && (now - lastFetchTime < CACHE_TTL)) {
      return cachedAccessToken;
    }

    const accessToken = await SecureStoreAdapter.getAccessToken();
    cachedAccessToken = accessToken;
    lastFetchTime = now;
    return accessToken;
  },

  /**
   * Clears the cached token (call this after logout or 401).
   */
  clearCache(): void {
    cachedAccessToken = null;
    lastFetchTime = 0;
  },

  /**
   * Retrieves the current refresh token.
   */
  async getRefreshToken(): Promise<string | null> {
    const { refreshToken } = await SecureStoreAdapter.getTokens();
    return refreshToken;
  }
};
