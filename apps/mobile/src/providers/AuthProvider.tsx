import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IAuthService } from '../infrastructure/auth/AuthService';
import { SessionRestoration } from '../infrastructure/auth/SessionRestoration';
import { IPushTokenRegistrationService } from '../features/notifications/application/IPushTokenRegistrationService';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextType {
  status: AuthStatus;
  login: (payload: unknown) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthProviderProps {
  authService: IAuthService;
  pushTokenRegistrationService?: IPushTokenRegistrationService;
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  authService,
  pushTokenRegistrationService,
  children,
}) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;
    
    async function initialize() {
      try {
        const session = await SessionRestoration.restoreSession();
        if (mounted) {
          setStatus(session.status);
          if (session.status === 'authenticated' && pushTokenRegistrationService) {
            pushTokenRegistrationService.registerPushToken().catch(() => {});
          }
        }
      } catch (error) {
        if (mounted) {
          setStatus('anonymous');
        }
      }
    }

    initialize();
    
    return () => {
      mounted = false;
    };
  }, [pushTokenRegistrationService]);

  const login = async (payload: unknown) => {
    await authService.login(payload);
    setStatus('authenticated');
  };

  const logout = async () => {
    await authService.logout();
    queryClient.clear(); // Clear all queries on logout for a complete reset
    setStatus('anonymous');
  };

  const value = useMemo(() => ({
    status,
    login,
    logout
  }), [status, authService]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
