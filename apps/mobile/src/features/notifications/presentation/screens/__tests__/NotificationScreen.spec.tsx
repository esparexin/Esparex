import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../../providers/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated' }),
}));

jest.mock('../../../../../navigation/navigationRef', () => ({
  navigate: jest.fn(),
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

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

import { NotificationScreen } from '../NotificationScreen';
import { useNotifications } from '../../hooks/useNotifications';
import { useMarkNotificationRead } from '../../hooks/useMarkNotificationRead';
import { AppNotification } from '../../../domain/Notification';

jest.mock('../../hooks/useNotifications');
jest.mock('../../hooks/useMarkNotificationRead');

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockUseMarkNotificationRead = useMarkNotificationRead as jest.MockedFunction<
  typeof useMarkNotificationRead
>;

describe('NotificationScreen Component', () => {
  const sampleNotifications: AppNotification[] = [
    {
      id: 'notif-10',
      type: 'CHAT',
      title: 'New Chat Inquiry',
      body: 'Seller responded to your offer.',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification items and header', () => {
    mockUseNotifications.mockReturnValue({
      data: sampleNotifications,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    mockUseMarkNotificationRead.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    } as any);

    const { getByText } = render(<NotificationScreen />);
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('New Chat Inquiry')).toBeTruthy();
    expect(getByText('Seller responded to your offer.')).toBeTruthy();
    expect(getByText('Mark all read')).toBeTruthy();
  });

  it('triggers mark all read when button pressed', () => {
    const mockMutate = jest.fn();

    mockUseNotifications.mockReturnValue({
      data: sampleNotifications,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    mockUseMarkNotificationRead.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    const { getByText } = render(<NotificationScreen />);

    fireEvent.press(getByText('Mark all read'));
    expect(mockMutate).toHaveBeenCalledWith(undefined);
  });

  it('renders empty state when there are no notifications', () => {
    mockUseNotifications.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    mockUseMarkNotificationRead.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    } as any);

    const { getByText } = render(<NotificationScreen />);
    expect(getByText('No Notifications')).toBeTruthy();
  });
});
