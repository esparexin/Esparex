import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    userService: {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
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

const mockLogout = jest.fn();

jest.mock('../../../../../providers/AuthProvider', () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: { id: 'usr-1' },
    isAuthenticated: true,
  }),
}));

import { SettingsScreen } from '../SettingsScreen';
import { useProfile } from '../../hooks/useProfile';
import { User } from '@esparex/contracts';

jest.mock('../../hooks/useProfile');

const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;

describe('SettingsScreen Component', () => {
  let queryClient: QueryClient;

  const sampleUser: User = {
    id: 'usr-profile-99',
    role: 'user',
    mobile: '+919876543210',
    name: 'Jane Doe',
    email: 'jane@example.com',
    isPhoneVerified: true,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderScreen = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsScreen />
      </QueryClientProvider>
    );

  it('renders user settings and profile information', () => {
    mockUseProfile.mockReturnValue({
      data: sampleUser,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);

    const { getByText } = renderScreen();
    expect(getByText('Account Information')).toBeTruthy();
    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('jane@example.com')).toBeTruthy();
    expect(getByText('Push Notifications')).toBeTruthy();
  });

  it('opens edit modal when Edit button is pressed', () => {
    mockUseProfile.mockReturnValue({
      data: sampleUser,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);

    const { getByText, queryByText } = renderScreen();
    expect(queryByText('Save Changes')).toBeNull();

    fireEvent.press(getByText('Edit'));
    expect(getByText('Save Changes')).toBeTruthy();
  });
});
