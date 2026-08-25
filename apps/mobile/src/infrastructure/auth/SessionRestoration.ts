import { SecureStoreAdapter } from './SecureStoreAdapter';

export type SessionState =
  | { status: 'authenticated'; accessToken: string; refreshToken?: string }
  | { status: 'anonymous' };

/**
 * Handles the cold-launch session initialization by querying the secure store.
 * Returns the resolved session state to be utilized by the AuthProvider later.
 * Architecture Note: Does not mutate application state context directly.
 */
export const SessionRestoration = {
  /**
   * Restores the session from the hardware-backed keystore.
   */
  async restoreSession(): Promise<SessionState> {
    try {
      const accessToken = await SecureStoreAdapter.getAccessToken();

      if (accessToken) {
        return {
          status: 'authenticated',
          accessToken,
        };
      }

      return { status: 'anonymous' };
    } catch (error) {
      // In case of Keystore failure, fallback to anonymous (e.g. key corruption)
      return { status: 'anonymous' };
    }
  }
};
