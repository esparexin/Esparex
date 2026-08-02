/**
 * PushNotificationPayload — domain representation of a received push notification payload.
 * No Expo SDK types leak beyond the infrastructure adapter boundary.
 */
export interface PushNotificationPayload {
  readonly id: string;
  readonly title?: string;
  readonly body?: string;
  readonly data?: Record<string, unknown>;
}

/**
 * NotificationResponse — domain representation of a user interaction/tap on a notification.
 */
export interface NotificationResponse {
  readonly actionIdentifier: string;
  readonly notification: PushNotificationPayload;
}
