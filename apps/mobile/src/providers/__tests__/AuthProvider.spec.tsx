import React, { useEffect } from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthProvider';
import { SessionRestoration } from '../../infrastructure/auth/SessionRestoration';
import { IAuthService } from '../../infrastructure/auth/AuthService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the SessionRestoration module
jest.mock('../../infrastructure/auth/SessionRestoration', () => ({
  SessionRestoration: {
    restoreSession: jest.fn(),
  },
}));



// Instead of <button onClick={...}>, in React Native Testing Library we use fireEvent.press.
// However, standard HTML tags are easier for quick testing with RNTL if using web presets,
// but better to use proper React Native Text/TouchableOpacity, or just call hooks directly.
// Let's create a custom hook test or simple consumer.
import { View, Text, TouchableOpacity } from 'react-native';

const MobileTestConsumer = () => {
  const { status, login, logout } = useAuth();
  return (
    <View>
      <Text testID="status">{status}</Text>
      <TouchableOpacity testID="login-btn" onPress={() => login({ user: 'test' })} />
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
      login: jest.fn().mockResolvedValue({ userId: 'user-1' }),
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
    // We delay the mock so we can see the loading state
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
      accessToken: 'token',
      refreshToken: 'token'
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

  it('should call authService.login and update status when login is invoked', async () => {
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

    // Simulate login
    const consumer = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider authService={mockAuthService}>
          <MobileTestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    await act(async () => {
      fireEvent.press(screen.getByTestId('login-btn'));
    });

    expect(mockAuthService.login).toHaveBeenCalledWith({ user: 'test' });
    expect(screen.getByTestId('status').props.children).toBe('authenticated');
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

  it('should throw an error if useAuth is used outside of AuthProvider', () => {
    // Suppress console.error for expected React boundary error
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<MobileTestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    
    consoleError.mockRestore();
  });
});
