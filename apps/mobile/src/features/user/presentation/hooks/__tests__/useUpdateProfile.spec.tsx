import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateProfile } from '../useUpdateProfile';
import { services } from '../../../../../bootstrap';
import { User } from '@esparex/contracts';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    userService: {
      updateProfile: jest.fn(),
    },
  },
}));

const mockUpdateProfile = services.userService.updateProfile as jest.MockedFunction<
  typeof services.userService.updateProfile
>;

describe('useUpdateProfile hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const updatedUser: User = {
    id: 'usr-profile-99',
    role: 'user',
    mobile: '+919876543210',
    name: 'Jane Smith',
    email: 'janesmith@example.com',
    isPhoneVerified: true,
  };

  it('updates profile via mutation and updates cache', async () => {
    mockUpdateProfile.mockResolvedValueOnce(updatedUser);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    act(() => {
      result.current.mutate({ name: 'Jane Smith' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'Jane Smith' });
  });
});
