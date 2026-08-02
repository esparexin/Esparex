import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useNotifications,
  useUnreadNotificationsCount,
} from '../useNotifications';
import { services } from '../../../../../bootstrap';
import { AppNotification } from '../../../domain/Notification';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    notificationService: {
      getNotifications: jest.fn(),
    },
  },
}));

const mockGetNotifications = services.notificationService
  .getNotifications as jest.MockedFunction<
  typeof services.notificationService.getNotifications
>;

const makeWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const sampleNotifications: AppNotification[] = [
  {
    id: 'n-1',
    type: 'CHAT',
    title: 'New offer on your listing',
    body: 'Someone made an offer.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n-2',
    type: 'AD_STATUS',
    title: 'Listing approved',
    body: 'Your listing is live.',
    isRead: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n-3',
    type: 'CHAT',
    title: 'Chat message received',
    body: 'You have a new message.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

describe('useNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns notifications from the service', async () => {
    mockGetNotifications.mockResolvedValueOnce(sampleNotifications);

    const { result } = renderHook(() => useNotifications(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleNotifications);
    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when service resolves with empty list', async () => {
    mockGetNotifications.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useNotifications(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useUnreadNotificationsCount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns count of unread notifications', async () => {
    mockGetNotifications.mockResolvedValueOnce(sampleNotifications);

    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(2));
  });

  it('returns 0 when all notifications are read', async () => {
    const allRead = sampleNotifications.map((n) => ({ ...n, isRead: true }));
    mockGetNotifications.mockResolvedValueOnce(allRead);

    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(0));
  });

  it('returns 0 when notifications list is empty', async () => {
    mockGetNotifications.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(0));
  });
});
