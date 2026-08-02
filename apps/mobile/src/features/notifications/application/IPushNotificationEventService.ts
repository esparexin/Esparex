import { PushNotificationPayload, NotificationResponse } from '../domain/NotificationPayload';

/**
 * IPushNotificationEventService — application-layer port for runtime notification events,
 * foreground alert presentation, background response listeners, and OS badge management.
 */
export interface IPushNotificationEventService {
  /**
   * Configures foreground notification handler rules (banner, sound, badge).
   */
  configureNotificationHandler(): void;

  /**
   * Subscribes a callback to receive notifications when app is in foreground.
   * Returns an unsubscribe cleanup function.
   */
  addNotificationReceivedListener(
    listener: (notification: PushNotificationPayload) => void
  ): () => void;

  /**
   * Subscribes a callback when user taps/interacts with a notification.
   * Returns an unsubscribe cleanup function.
   */
  addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void
  ): () => void;

  /**
   * Sets OS application icon badge count.
   */
  setBadgeCount(count: number): Promise<boolean>;

  /**
   * Gets current OS application icon badge count.
   */
  getBadgeCount(): Promise<number>;
}
