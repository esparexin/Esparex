import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthProvider';
import { SessionRestoration } from '../../infrastructure/auth/SessionRestoration';
import { IAuthService } from '../../infrastructure/auth/AuthService';
import { notifyUnauthorized } from '../../infrastructure/api/apiClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, TouchableOpacity } from 'react-native';

// Mock the SessionRestoration module
jest.mock('../../infrastructure/auth/SessionRestoration', () => ({
  SessionRestoration: {
    restoreSession: jest.fn(),
  },
}));

const MobileTestConsumer = () => {
  const { status, sendOtp, verifyOtp, cancelOtp, logout } = useAuth();
  return (
    <View>
      <Text testID="status">{status}</Text>
      <TouchableOpacity testID="send-otp-btn" onPress={() => sendOtp('9876543210')} />
      <TouchableOpacity testID="verify-otp-btn" onPress={() => verifyOtp('9876543210', '123456')} />
      <TouchableOpacity testID="cancel-otp-btn" onPress={() => cancelOtp('9876543210')} />
      <TouchableOpacity testID="logout-btn" onPress={() => logout()} />
    </View>
  );
};

describe('AuthProvider', () => {
  let mockAuthService: jest.Mocked<IAuthService>;
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService = {
      sendOtp: jest.fn().mockResolvedValue({ success: true, isNewUser: false, otpExpiresIn: 300 }),
      verifyOtp: jest.fn().mockResolvedValue({ userId: 'user-1', accessToken: 'token-123' }),
      cancelOtp: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
    };
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it('should initialize to loading status initially', async () => {
    let resolveSession: (value: { status: 'anonymous' | 'authenticated' }) => void;
    (SessionRestoration.restoreSession as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider authService={mockAuthService}>
          <MobileTestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('status').props.children).toBe('loading');
    
    // Resolve the promise
    await act(async () => {
      resolveSession({ status: 'anonymous' });
    });
    
    expect(screen.getByTestId('status').props.children).toBe('anonymous');
  });

  it('should transition to authenticated if SessionRestoration returns authenticated', async () => {
    (SessionRestoration.restoreSession as jest.Mock).mockResolvedValue({
      status: 'authenticated',
      accessToken: 'token-123',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider authService={mockAuthService}>
          <MobileTestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('authenticated');
    });
  });

  it('should transition to anonymous if SessionRestoration throws', async () => {
    (SessionRestoration.restoreSession as jest.Mock).mockRejectedValue(new Error('Corrupt state'));

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider authService={mockAuthService}>
          <MobileTestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('anonymous');
    });
  });

  it('should call authService.verifyOtp and update status when verifyOtp is invoked', async () => {
    (SessionRestoration.restoreSession as jest.Mock).mockResolvedValue({ status: 'anonymous' });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider authService={mockAuthService}>
          <MobileTestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('anonymous');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('verify-otp-btn'));
    });

    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('9876543210', '123456', undefined);
    expect(screen.getByTestId('status').props.children).toBe('authenticated');
  });

  it('should call authService.cancelOtp when cancelOtp is invoked', async () => {
    (SessionRestoration.restoreSession as jest.Mock).mockResolvedValue({ status: 'anonymous' });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider authService={mockAuthService}>
          <MobileTestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('anonymous');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('cancel-otp-btn'));
    });

    expect(mockAuthService.cancelOtp).toHaveBeenCalledWith('9876543210');
  });

  it('should call authService.logout and update status when logout is invoked', async () => {
    (SessionRestoration.restoreSession as jest.Mock).mockResolvedValue({ status: 'authenticated' });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider authService={mockAuthService}>
          <MobileTestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('authenticated');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('logout-btn'));
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(screen.getByTestId('status').props.children).toBe('anonymous');
  });

  it('should invalidate queries on successful verifyOtp', async () => {
    (SessionRestoration.restoreSession as jest.Mock).mockResolvedValue({ status: 'anonymous' });
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider authService={mockAuthService}>
          <MobileTestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('anonymous');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('verify-otp-btn'));
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should reset status to anonymous when notifyUnauthorized is dispatched', async () => {
    (SessionRestoration.restoreSession as jest.Mock).mockResolvedValue({ status: 'authenticated' });
    const clearSpy = jest.spyOn(queryClient, 'clear');

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider authService={mockAuthService}>
          <MobileTestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('authenticated');
    });

    act(() => {
      notifyUnauthorized();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('anonymous');
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  it('should throw an error if useAuth is used outside of AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<MobileTestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    
    consoleError.mockRestore();
  });
});
