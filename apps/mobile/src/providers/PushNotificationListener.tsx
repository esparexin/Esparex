import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IPushNotificationEventService } from '../features/notifications/application/IPushNotificationEventService';
import { NotificationNavigationResolver } from '../navigation/NotificationNavigationResolver';
import { useUnreadNotificationsCount } from '../features/notifications/presentation/hooks/useNotifications';

interface PushNotificationListenerProps {
  pushNotificationEventService?: IPushNotificationEventService;
  children?: React.ReactNode;
}

export const PushNotificationListener: React.FC<PushNotificationListenerProps> = ({
  pushNotificationEventService,
  children,
}) => {
  const queryClient = useQueryClient();
  const unreadCount = useUnreadNotificationsCount();

  // Synchronize OS application icon badge with unread notifications count
  useEffect(() => {
    if (typeof unreadCount === 'number' && typeof pushNotificationEventService?.setBadgeCount === 'function') {
      pushNotificationEventService.setBadgeCount(unreadCount).catch(() => {});
    }
  }, [unreadCount, pushNotificationEventService]);

  // Set up listeners on mount and clean up on unmount
  useEffect(() => {
    if (!pushNotificationEventService) return;

    // 1. Configure foreground alert presentation rules
    if (typeof pushNotificationEventService.configureNotificationHandler === 'function') {
      pushNotificationEventService.configureNotificationHandler();
    }

    // 2. Subscribe to foreground notification received event
    let removeReceivedListener: (() => void) | undefined;
    if (typeof pushNotificationEventService.addNotificationReceivedListener === 'function') {
      removeReceivedListener = pushNotificationEventService.addNotificationReceivedListener(
        () => {
          // Invalidate notifications query to refresh real-time unread counts
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
        }
      );
    }

    // 3. Subscribe to user tap response event
    let removeResponseListener: (() => void) | undefined;
    if (typeof pushNotificationEventService.addNotificationResponseReceivedListener === 'function') {
      removeResponseListener = pushNotificationEventService.addNotificationResponseReceivedListener(
        (response) => {
          NotificationNavigationResolver.handleNotificationResponse(response).catch(() => {});
        }
      );
    }

    return () => {
      if (typeof removeReceivedListener === 'function') {
        removeReceivedListener();
      }
      if (typeof removeResponseListener === 'function') {
        removeResponseListener();
      }
    };
  }, [pushNotificationEventService, queryClient]);

  return <>{children}</>;
};
