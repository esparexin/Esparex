import React from 'react';
import { IAuthService } from '../infrastructure/auth/AuthService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';

import { IServices } from '../bootstrap/services';

interface AppProviderProps {
  children: React.ReactNode;
  services: IServices;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, services }) => {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider authService={services.authService}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
};
