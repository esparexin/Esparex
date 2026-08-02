/**
 * IPushTokenRegistrationService — application-layer port for push token backend registration.
 *
 * Responsibilities:
 *   - Orchestrate acquiring push token via IPushNotificationService
 *   - Register push token with backend POST /api/v1/notifications/register
 *   - Unregister push token during logout
 *
 * Does NOT:
 *   - Interact directly with React or UI state
 *   - Handle notification payload reception (PR 3)
 */
export interface IPushTokenRegistrationService {
  /**
   * Acquire Expo push token and register with backend.
   * Returns true on success, false on failure (fail-safe).
   */
  registerPushToken(): Promise<boolean>;

  /**
   * Unregister currently registered push token from backend.
   * Returns true on success, false on failure (fail-safe).
   */
  unregisterPushToken(): Promise<boolean>;
}
