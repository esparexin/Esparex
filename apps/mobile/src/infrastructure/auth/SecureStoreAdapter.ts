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
   * Securely saves access and refresh tokens to the native hardware keystore.
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ESPAREX_AUTH_ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(ESPAREX_AUTH_REFRESH_TOKEN, refreshToken),
    ]);
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
    // Only verify presence, don't allocate strings if not needed
    const { accessToken, refreshToken } = await this.getTokens();
    return accessToken !== null && refreshToken !== null;
  },

  /**
   * Verification command to test Keystore accessibility (SS-001).
   */
  async isAvailable(): Promise<boolean> {
    return SecureStore.isAvailableAsync();
  }
};
