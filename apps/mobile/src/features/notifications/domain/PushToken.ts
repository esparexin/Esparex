/**
 * PushToken — immutable domain model representing a device push token.
 *
 * Returned by IPushNotificationService after successful registration.
 * Passed to the backend (PR 2) to persist against the authenticated user.
 *
 * Expo-specific types never leak beyond ExpoPushNotificationService.
 */
export interface PushToken {
  readonly value: string;                  // e.g. "ExponentPushToken[xxx]"
  readonly platform: 'ios' | 'android';
}
