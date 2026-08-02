import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { PushNotificationListener } from './PushNotificationListener';

import { IServices } from '../bootstrap/services';

interface AppProviderProps {
  children: React.ReactNode;
  services: IServices;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, services }) => {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider
          authService={services.authService}
          pushTokenRegistrationService={services.pushTokenRegistrationService}
        >
          <PushNotificationListener
            pushNotificationEventService={services.pushNotificationEventService}
          >
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </PushNotificationListener>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
};
