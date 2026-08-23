import * as Notifications from 'expo-notifications';
import { IPushNotificationEventService } from '../application/IPushNotificationEventService';
import { PushNotificationPayload, NotificationResponse } from '../domain/NotificationPayload';

/**
 * ExpoPushNotificationEventService — infrastructure adapter for runtime notification events using Expo SDK.
 */
export class ExpoPushNotificationEventService implements IPushNotificationEventService {
  configureNotificationHandler(): void {
    if (typeof Notifications?.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  }

  addNotificationReceivedListener(
    listener: (notification: PushNotificationPayload) => void
  ): () => void {
    if (typeof Notifications?.addNotificationReceivedListener !== 'function') {
      return () => {};
    }

    try {
      const subscription = Notifications.addNotificationReceivedListener((expoNotification) => {
        const payload: PushNotificationPayload = {
          id: expoNotification.request.identifier,
          title: expoNotification.request.content.title ?? undefined,
          body: expoNotification.request.content.body ?? undefined,
          data: (expoNotification.request.content.data as Record<string, unknown> | undefined) ?? {},
        };
        listener(payload);
      });

      return () => {
        subscription?.remove?.();
      };
    } catch {
      return () => {};
    }
  }

  addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void
  ): () => void {
    if (typeof Notifications?.addNotificationResponseReceivedListener !== 'function') {
      return () => {};
    }

    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((expoResponse) => {
        const response: NotificationResponse = {
          actionIdentifier: expoResponse.actionIdentifier,
          notification: {
            id: expoResponse.notification.request.identifier,
            title: expoResponse.notification.request.content.title ?? undefined,
            body: expoResponse.notification.request.content.body ?? undefined,
            data: (expoResponse.notification.request.content.data as Record<string, unknown> | undefined) ?? {},
          },
        };
        listener(response);
      });

      return () => {
        subscription?.remove?.();
      };
    } catch {
      return () => {};
    }
  }

  async setBadgeCount(count: number): Promise<boolean> {
    try {
      const sanitizedCount = Math.max(0, Math.floor(count));
      return await Notifications.setBadgeCountAsync(sanitizedCount);
    } catch {
      return false;
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch {
      return 0;
    }
  }
}
