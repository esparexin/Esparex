import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications, useUnreadNotificationsCount } from '../useNotifications';
import { useMarkNotificationRead } from '../useMarkNotificationRead';
import { services } from '../../../../../bootstrap';
import { AppNotification } from '../../../domain/Notification';

jest.mock('../../../../../providers/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated' }),
}));

jest.mock('../../../../../bootstrap', () => ({
  services: {
    notificationService: {
      getNotifications: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    },
  },
}));

const mockGetNotifications = services.notificationService.getNotifications as jest.MockedFunction<
  typeof services.notificationService.getNotifications
>;
const mockMarkRead = services.notificationService.markRead as jest.MockedFunction<
  typeof services.notificationService.markRead
>;
const mockMarkAllRead = services.notificationService.markAllRead as jest.MockedFunction<
  typeof services.notificationService.markAllRead
>;

describe('Notifications hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const sampleNotifications: AppNotification[] = [
    {
      id: 'notif-1',
      type: 'CHAT',
      title: 'New Message',
      body: 'Rahul sent you a message about Brake Disc',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      type: 'AD_STATUS',
      title: 'Listing Approved',
      body: 'Your Hyundai Creta Alloy Wheel ad is now live',
      isRead: true,
      createdAt: new Date().toISOString(),
    },
  ];

  it('fetches notifications list and calculates unread count', async () => {
    mockGetNotifications.mockResolvedValueOnce(sampleNotifications);

    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(sampleNotifications);

    const { result: unreadResult } = renderHook(() => useUnreadNotificationsCount(), { wrapper });
    expect(unreadResult.current).toBe(1);
  });

  it('marks single notification as read', async () => {
    mockMarkRead.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper });

    act(() => {
      result.current.mutate('notif-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockMarkRead).toHaveBeenCalledWith('notif-1');
  });

  it('marks all notifications as read', async () => {
    mockMarkAllRead.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper });

    act(() => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
  });
});
