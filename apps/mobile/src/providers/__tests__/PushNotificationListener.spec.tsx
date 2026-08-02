import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PushNotificationListener } from '../PushNotificationListener';
import { IPushNotificationEventService } from '../../features/notifications/application/IPushNotificationEventService';

jest.mock('../../features/notifications/presentation/hooks/useNotifications', () => ({
  useUnreadNotificationsCount: () => 3,
}));

describe('PushNotificationListener', () => {
  let mockEventService: jest.Mocked<IPushNotificationEventService>;
  let queryClient: QueryClient;
  let removeReceived: jest.Mock;
  let removeResponse: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient();

    removeReceived = jest.fn();
    removeResponse = jest.fn();

    mockEventService = {
      configureNotificationHandler: jest.fn(),
      addNotificationReceivedListener: jest.fn().mockReturnValue(removeReceived),
      addNotificationResponseReceivedListener: jest.fn().mockReturnValue(removeResponse),
      setBadgeCount: jest.fn().mockResolvedValue(true),
      getBadgeCount: jest.fn().mockResolvedValue(3),
    };
  });

  it('configures notification handler and subscribes to listeners on mount', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PushNotificationListener pushNotificationEventService={mockEventService} />
      </QueryClientProvider>
    );

    expect(mockEventService.configureNotificationHandler).toHaveBeenCalled();
    expect(mockEventService.addNotificationReceivedListener).toHaveBeenCalled();
    expect(mockEventService.addNotificationResponseReceivedListener).toHaveBeenCalled();
    expect(mockEventService.setBadgeCount).toHaveBeenCalledWith(3);
  });

  it('unsubscribes listeners cleanly on unmount', () => {
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <PushNotificationListener pushNotificationEventService={mockEventService} />
      </QueryClientProvider>
    );

    unmount();

    expect(removeReceived).toHaveBeenCalled();
    expect(removeResponse).toHaveBeenCalled();
  });
});
