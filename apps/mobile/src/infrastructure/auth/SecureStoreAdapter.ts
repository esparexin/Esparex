import * as SecureStore from 'expo-secure-store';
import { ITokenStorage } from './ITokenStorage';

export const ESPAREX_AUTH_ACCESS_TOKEN = 'ESPAREX_AUTH_ACCESS_TOKEN';
export const ESPAREX_AUTH_REFRESH_TOKEN = 'ESPAREX_AUTH_REFRESH_TOKEN';

/**
 * Encrypted Auth Token Persistence Architecture (ADR-002).
 * Strictly handles native hardware-backed storage for authentication tokens.
 * Contains no business logic or network side effects.
 */
export const SecureStoreAdapter: ITokenStorage = {
  /**
   * Securely saves the 7-day JWT access token to the native hardware keystore.
   */
  async setAccessToken(accessToken: string): Promise<void> {
    await SecureStore.setItemAsync(ESPAREX_AUTH_ACCESS_TOKEN, accessToken);
  },

  /**
   * Retrieves the access token from the native keystore.
   */
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ESPAREX_AUTH_ACCESS_TOKEN);
  },

  /**
   * Securely saves access and refresh tokens to the native hardware keystore.
   */
  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    const promises: Promise<void>[] = [
      SecureStore.setItemAsync(ESPAREX_AUTH_ACCESS_TOKEN, accessToken),
    ];
    if (refreshToken) {
      promises.push(SecureStore.setItemAsync(ESPAREX_AUTH_REFRESH_TOKEN, refreshToken));
    }
    await Promise.all(promises);
  },

  /**
   * Retrieves both access and refresh tokens from the native keystore.
   * Resolves with null values if tokens are not found.
   */
  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ESPAREX_AUTH_ACCESS_TOKEN),
      SecureStore.getItemAsync(ESPAREX_AUTH_REFRESH_TOKEN),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  },

  /**
   * Explicitly removes both access and refresh tokens from the native keystore.
   */
  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ESPAREX_AUTH_ACCESS_TOKEN),
      SecureStore.deleteItemAsync(ESPAREX_AUTH_REFRESH_TOKEN),
    ]);
  },

  /**
   * Checks if valid token data exists in storage.
   */
  async hasTokens(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return accessToken !== null;
  },

  /**
   * Verification command to test Keystore accessibility (SS-001).
   */
  async isAvailable(): Promise<boolean> {
    return SecureStore.isAvailableAsync();
  }
};
