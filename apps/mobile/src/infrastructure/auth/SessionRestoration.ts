import { SecureStoreAdapter } from './SecureStoreAdapter';

export type SessionState =
  | { status: 'authenticated'; accessToken: string; refreshToken?: string }
  | { status: 'anonymous' };

/**
 * Checks whether a JWT token has expired or is invalid.
 * Validates payload exp claim against current timestamp (with 10s grace leeway).
 */
export function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    let jsonStr: string;
    if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
    } else if (typeof atob !== 'undefined') {
      jsonStr = atob(payloadBase64);
    } else {
      return false;
    }
    const decoded = JSON.parse(jsonStr) as { exp?: number };
    if (typeof decoded.exp === 'number') {
      return decoded.exp * 1000 <= Date.now() + 10000;
    }
    return false;
  } catch {
    return false;
  }
}

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
        if (isJwtExpired(accessToken)) {
          await SecureStoreAdapter.clearTokens().catch(() => {});
          return { status: 'anonymous' };
        }

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
