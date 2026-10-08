import { PushToken } from '../domain/PushToken';

// ---------------------------------------------------------------------------
// Result type — discriminated union (matches SubmitResult pattern)
// ---------------------------------------------------------------------------

/**
 * PushRegistrationResult — typed outcome of registerForPushNotifications().
 *
 * Callers pattern-match on `success` rather than catching thrown errors:
 *
 *   const result = await pushNotificationService.registerForPushNotifications();
 *   if (result.success) { sendTokenToBackend(result.token); }
 *   else { log(result.reason); }
 */
export type PushRegistrationResult =
  | { success: true; token: PushToken }
  | { success: false; reason: 'permission-denied' };



// ---------------------------------------------------------------------------
// Permission status
// ---------------------------------------------------------------------------

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

/**
 * IPushNotificationService — application-layer port for push token management.
 *
 * Responsibilities:
 *   - Request OS-level notification permission
 *   - Acquire an Expo push token for the current device
 *   - Expose a single registerForPushNotifications() convenience method
 *
 * Does NOT:
 *   - Send the token to the backend (PR 2)
 *   - Handle received notifications (PR 3)
 *   - Know about React, navigation, or UI state
 */
export interface IPushNotificationService {
  /**
   * Request OS notification permission.
   *
   * Returns the resulting status. On iOS this shows the system dialog;
   * on Android 13+ it requests POST_NOTIFICATIONS. Subsequent calls return
   * the current status without re-prompting if already determined.
   */
  requestPermission(): Promise<PermissionStatus>;

  /**
   * Acquire the Expo push token for this device.
   *
   * Throws a `PushRegistrationFailure`-keyed Error if:
   *   - Running in a non-physical environment (Simulator/Emulator)
   *   - Expo project ID is missing from Constants.expoConfig
   *   - The SDK call itself fails
   *
   * Callers should call requestPermission() first.
   */
  getExpoPushToken(): Promise<PushToken>;

  /**
   * Full registration pipeline:
   *   1. requestPermission()
   *   2. If denied → return { success: false, reason: 'permission-denied' }
   *   3. getExpoPushToken()
   *   4. Return { success: true, token }
   *
   * This is the primary method callers should use.
   */
  registerForPushNotifications(): Promise<PushRegistrationResult>;
}
