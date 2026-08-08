import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AppProvider } from '../AppProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../AuthProvider';
import { useTheme } from '../ThemeProvider';
import { IServices } from '../../bootstrap/services';
import { AuthResult, IAuthService } from '../../infrastructure/auth/AuthService';
import { ListingService } from '../../features/listings/application/ListingService';
import { ApiListingRepository } from '../../features/listings/application/ApiListingRepository';
import { PostAdService } from '../../features/postAd/application/PostAdService';
import { UserService } from '../../features/user/application/UserService';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  setBadgeCountAsync: jest.fn().mockResolvedValue(true),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest.fn().mockImplementation(({ children }) => children(inset)),
    SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
    useSafeAreaInsets: jest.fn().mockReturnValue(inset),
  };
});

jest.mock('../../infrastructure/auth/SessionRestoration', () => ({
  SessionRestoration: {
    restoreSession: jest.fn().mockResolvedValue({ status: 'idle' }),
  },
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// A counter outside the component to track how many times the client was retrieved
let clientInstanceCount = 0;
let lastClient: unknown = null;

const TestChild = () => {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const theme = useTheme();
  
  const [count, setCount] = useState(0);

  if (queryClient !== lastClient) {
    clientInstanceCount++;
    lastClient = queryClient;
  }

  return (
    <View>
      <Text testID="qc-status">{queryClient ? 'initialized' : 'missing'}</Text>
      <Text testID="auth-status">{auth.status}</Text>
      <Text testID="theme-status">{theme.colorScheme}</Text>
      <Text testID="count-status">{count}</Text>
      <TouchableOpacity testID="increment-btn" onPress={() => setCount(c => c + 1)}>
        <Text>Increment</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('AppProvider', () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    clientInstanceCount = 0;
    lastClient = null;
  });



  const mockAuthService: IAuthService = {
    login: jest.fn<Promise<AuthResult>, [unknown]>(),
    logout: jest.fn<Promise<void>, []>(),
  };

  const mockListingService = new ListingService(new ApiListingRepository());
  mockListingService.getMarketplaceFeed = jest.fn();
  mockListingService.getListingDetails = jest.fn();

  const mockServices: IServices = {
    authService: mockAuthService,
    userService: { getProfile: jest.fn() } as unknown as UserService,
    listingService: mockListingService,
    postAdService: { submit: jest.fn() } as unknown as PostAdService,
    categoryService: { getCategories: jest.fn() } as unknown as any,
    chatService: { getConversations: jest.fn() } as unknown as any,
    notificationService: { getNotifications: jest.fn() } as unknown as any,
    pushNotificationService: {
      requestPermission: jest.fn(),
      getExpoPushToken: jest.fn(),
      registerForPushNotifications: jest.fn(),
    } as unknown as any,
    pushNotificationEventService: {
      configureNotificationHandler: jest.fn(),
      addNotificationReceivedListener: jest.fn().mockReturnValue(() => {}),
      addNotificationResponseReceivedListener: jest.fn().mockReturnValue(() => {}),
      setBadgeCount: jest.fn().mockResolvedValue(true),
      getBadgeCount: jest.fn().mockResolvedValue(0),
    } as unknown as any,
    pushTokenRegistrationService: {
      registerPushToken: jest.fn().mockResolvedValue(true),
      unregisterPushToken: jest.fn().mockResolvedValue(true),
    } as unknown as any,
    imagePicker: { pick: jest.fn() },
    businessService: { getMyBusiness: jest.fn() } as unknown as any,
    paymentService: { getPlans: jest.fn() } as unknown as any,
    smartAlertService: { getSmartAlerts: jest.fn() } as unknown as any,
  };


  it('mounts children successfully and provides all contexts', async () => {
    const { getByTestId } = render(
      <AppProvider services={mockServices}>
        <TestChild />
      </AppProvider>
    );

    expect(getByTestId('qc-status').props.children).toBe('initialized');
    
    await waitFor(
      () => {
        expect(getByTestId('auth-status').props.children).toBe('idle');
      },
      { timeout: 10000 }
    );
    
    expect(getByTestId('theme-status').props.children).toBe('system');
  });

  it('ensures QueryClient is a singleton across rerenders', async () => {
    const { getByTestId } = render(
      <AppProvider services={mockServices}>
        <TestChild />
      </AppProvider>
    );

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('idle');
    });

    // Initial render means 1 instance created
    expect(clientInstanceCount).toBe(1);

    // Trigger a state change to force rerender
    fireEvent.press(getByTestId('increment-btn'));

    // Verify state updated
    expect(getByTestId('count-status').props.children).toBe(1);

    // Verify QueryClient wasn't recreated
    expect(clientInstanceCount).toBe(1);
  });
});
