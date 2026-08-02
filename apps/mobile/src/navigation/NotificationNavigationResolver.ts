import { Linking } from 'react-native';
import { NotificationResponse } from '../features/notifications/domain/NotificationPayload';

export const NotificationNavigationResolver = {
  /**
   * Resolves notification response payload into a deep link target URL and opens it.
   * Fail-safe: Returns boolean success indicator without throwing on invalid URLs.
   */
  async handleNotificationResponse(response: NotificationResponse): Promise<boolean> {
    try {
      const data = response.notification.data ?? {};
      const url = data.url as string | undefined;
      const target = data.target as string | undefined;
      const conversationId = data.conversationId as string | undefined;
      const listingId = data.listingId as string | undefined;

      let targetUrl: string | null = null;

      if (url && typeof url === 'string') {
        targetUrl = url;
      } else if (target === 'chat' && conversationId) {
        targetUrl = `esparex://chat/thread/${conversationId}`;
      } else if (target === 'listing' && listingId) {
        targetUrl = `esparex://listing/${listingId}`;
      } else if (target === 'notifications') {
        targetUrl = 'esparex://profile';
      }

      if (targetUrl) {
        await Linking.openURL(targetUrl);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  },
};
