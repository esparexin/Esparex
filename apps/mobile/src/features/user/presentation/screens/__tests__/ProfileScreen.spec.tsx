import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    userService: {
      getProfile: jest.fn(),
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

jest.mock('../../../../../providers/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated' }),
}));

import { ProfileScreen } from '../ProfileScreen';
import { useProfile } from '../../hooks/useProfile';
import { User } from '@esparex/contracts';
import { ROUTES } from '../../../../../navigation/routes';

jest.mock('../../hooks/useProfile');

const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;

// Minimal mock navigation prop required by the typed NativeStackScreenProps
const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() } as any;
const mockRoute = { key: 'ProfileOverview', name: 'ProfileOverview', params: undefined } as any;

describe('ProfileScreen Component', () => {
  const sampleUser: User = {
    id: 'usr-profile-99',
    role: 'user',
    mobile: '+919876543210',
    name: 'Jane Doe',
    email: 'jane@example.com',
    isPhoneVerified: true,
    isEmailVerified: true,
    userType: 'user',
    status: 'active',
    createdAt: '2025-01-15T00:00:00.000Z',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when profile query is pending', () => {
    mockUseProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    const { queryByText } = render(<ProfileScreen navigation={mockNavigation} route={mockRoute} />);
    expect(queryByText('Jane Doe')).toBeNull();
  });

  it('renders user profile details and activity menu entries when fetch succeeds', () => {
    mockUseProfile.mockReturnValue({
      data: sampleUser,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    const { getByText } = render(<ProfileScreen navigation={mockNavigation} route={mockRoute} />);
    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('+919876543210')).toBeTruthy();
    expect(getByText('Verified')).toBeTruthy();
    expect(getByText('My Ads & Listings')).toBeTruthy();
    expect(getByText('Saved Ads & Favorites')).toBeTruthy();
    expect(getByText('Smart Search Alerts')).toBeTruthy();
    expect(getByText('Register as Business')).toBeTruthy();
    expect(getByText('Ad Credits & Plans')).toBeTruthy();
    expect(getByText('Account Settings')).toBeTruthy();

    // Test navigation
    fireEvent.press(getByText('My Ads & Listings'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith(ROUTES.MY_LISTINGS);

    fireEvent.press(getByText('Saved Ads & Favorites'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith(ROUTES.SAVED_ADS);
  });

  it('renders error state when profile query fails', () => {
    mockUseProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    const { getByText } = render(<ProfileScreen navigation={mockNavigation} route={mockRoute} />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});
