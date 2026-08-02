import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfile } from '../useProfile';
import { services } from '../../../../../bootstrap';
import { User } from '@esparex/contracts';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    userService: {
      getProfile: jest.fn(),
    },
  },
}));

const mockGetProfile = services.userService.getProfile as jest.MockedFunction<
  typeof services.userService.getProfile
>;

describe('useProfile hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

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

  it('fetches current user profile successfully', async () => {
    mockGetProfile.mockResolvedValueOnce(sampleUser);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(sampleUser);
    expect(mockGetProfile).toHaveBeenCalledTimes(1);
  });
});
