import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IAuthService, SendOtpResult } from '../infrastructure/auth/AuthService';
import { SessionRestoration } from '../infrastructure/auth/SessionRestoration';
import { IPushTokenRegistrationService } from '../features/notifications/application/IPushTokenRegistrationService';
import { TokenProvider } from '../infrastructure/api/TokenProvider';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextType {
  status: AuthStatus;
  sendOtp: (mobile: string) => Promise<SendOtpResult>;
  verifyOtp: (mobile: string, otp: string, name?: string) => Promise<void>;
  cancelOtp: (mobile: string) => Promise<void>;
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

  const sendOtp = async (mobile: string): Promise<SendOtpResult> => {
    return await authService.sendOtp(mobile);
  };

  const verifyOtp = async (mobile: string, otp: string, name?: string) => {
    await authService.verifyOtp(mobile, otp, name);
    setStatus('authenticated');
  };

  const cancelOtp = async (mobile: string) => {
    await authService.cancelOtp(mobile);
  };

  const logout = async () => {
    await authService.logout();
    TokenProvider.clearCache();
    queryClient.clear(); // Clear all queries on logout for a complete reset
    setStatus('anonymous');
  };

  const value = useMemo(() => ({
    status,
    sendOtp,
    verifyOtp,
    cancelOtp,
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
