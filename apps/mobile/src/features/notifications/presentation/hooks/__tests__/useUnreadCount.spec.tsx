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
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('returns notifications from the service', async () => {
    mockGetNotifications.mockResolvedValueOnce(sampleNotifications);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleNotifications);
    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when service resolves with empty list', async () => {
    mockGetNotifications.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });
});

describe('useUnreadNotificationsCount', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('returns count of unread notifications', async () => {
    mockGetNotifications.mockResolvedValueOnce(sampleNotifications);

    const { result } = renderHook(
      () => ({
        count: useUnreadNotificationsCount(),
        query: useNotifications(),
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.count).toBe(2);
    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });

  it('returns 0 when all notifications are read', async () => {
    const allRead = sampleNotifications.map((n) => ({ ...n, isRead: true }));
    mockGetNotifications.mockResolvedValueOnce(allRead);

    const { result } = renderHook(
      () => ({
        count: useUnreadNotificationsCount(),
        query: useNotifications(),
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.count).toBe(0);
    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });

  it('returns 0 when notifications list is empty', async () => {
    mockGetNotifications.mockResolvedValueOnce([]);

    const { result } = renderHook(
      () => ({
        count: useUnreadNotificationsCount(),
        query: useNotifications(),
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.count).toBe(0);
    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });
});
