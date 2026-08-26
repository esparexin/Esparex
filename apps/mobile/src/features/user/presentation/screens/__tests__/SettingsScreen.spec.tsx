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

// Minimal mock navigation required by the typed NativeStackScreenProps
const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;
const mockRoute = { key: 'ProfileSettings', name: 'ProfileSettings', params: undefined } as any;

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
        <SettingsScreen navigation={mockNavigation} route={mockRoute} />
      </QueryClientProvider>
    );

  it('renders user settings and profile information', () => {
    mockUseProfile.mockReturnValue({
      data: sampleUser,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);

    const { getByText, getAllByText } = renderScreen();
    expect(getByText('Account Information')).toBeTruthy();
    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('jane@example.com')).toBeTruthy();
    expect(getAllByText('Notification Settings').length).toBeGreaterThan(0);
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
