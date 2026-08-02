import React from 'react';
import { render } from '@testing-library/react-native';

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

import { ProfileScreen } from '../ProfileScreen';
import { useProfile } from '../../hooks/useProfile';
import { User } from '@esparex/contracts';

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

  it('renders user profile details when fetch succeeds', () => {
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
    expect(getByText('Phone Verified')).toBeTruthy();
    expect(getByText('Mumbai, Maharashtra')).toBeTruthy();
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
