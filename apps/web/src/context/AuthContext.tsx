"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types/User";
import { authApi } from "@/lib/api/auth";
import logger from "@/lib/logger";
import {
  AUTH_SESSION_STORAGE_KEY,
  isValidUser,
  isBenignLogoutError,
} from "./auth/authHelpers";
import { useBackendReadyPoller } from "./auth/useBackendReadyPoller";
import { useUserFetcher } from "./auth/useUserFetcher";
import { useSessionSync } from "./auth/useSessionSync";
import type {
  AuthStatus,
  AuthStatusContextType,
  AuthUserContextType,
  AuthContextType,
  BackendReadyContextType,
} from "./auth/authTypes";

export type {
  AuthStatus,
  AuthStatusContextType,
  AuthUserContextType,
  AuthContextType,
};

/* -------------------------------------------------------------------------- */
/* Contexts                                                                   */
/* -------------------------------------------------------------------------- */

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

const AuthStatusContext =
  createContext<AuthStatusContextType | undefined>(undefined);

const AuthUserContext =
  createContext<AuthUserContextType | undefined>(undefined);

const BackendReadyContext =
  createContext<BackendReadyContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function AuthProvider({
  children,
  initialHasAuthCookie = false,
}: {
  children: ReactNode;
  initialHasAuthCookie?: boolean;
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { backendReady, setBackendReady, hasAuthHint, setHasAuthHint } =
    useBackendReadyPoller(initialHasAuthCookie);

  const [status, setStatus] = useState<AuthStatus>(
    initialHasAuthCookie ? "loading" : "unauthenticated"
  );

  const fetchingRef = useRef(false);
  const authBannerShownRef = useRef(false);
  const wasAuthenticatedRef = useRef(false);
  const staleSessionCleanupRef = useRef(false);
  const networkRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const networkRetryCountRef = useRef(0);

  const { fetchUser } = useUserFetcher({
    backendReady,
    setBackendReady,
    setHasAuthHint,
    user,
    setUser,
    setStatus,
    setError,
    routerRef,
    fetchingRef,
    authBannerShownRef,
    wasAuthenticatedRef,
    staleSessionCleanupRef,
    networkRetryTimerRef,
    networkRetryCountRef,
  });

  useSessionSync({
    backendReady,
    hasAuthHint,
    fetchUser,
    setUser,
    setStatus,
    setError,
  });

  /* ------------------------------------------------------------------------ */
  /* Manual Update                                                            */
  /* ------------------------------------------------------------------------ */

  const updateUser = useCallback(
    (newUser: User) => {
      if (!isValidUser(newUser)) {
        logger.error(
          "[Auth] Invalid user payload:",
          newUser
        );
        return;
      }

      setUser(newUser);
      setStatus("authenticated");
      setError(null);
      setHasAuthHint(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_SESSION_STORAGE_KEY, "1");
      }
      wasAuthenticatedRef.current = true;
    },
    [setHasAuthHint]
  );

  /* ------------------------------------------------------------------------ */
  /* Logout                                                                   */
  /* ------------------------------------------------------------------------ */

  const logout = useCallback(async (options?: { skipServerLogout?: boolean }) => {
    if (networkRetryTimerRef.current) {
      clearTimeout(networkRetryTimerRef.current);
      networkRetryTimerRef.current = null;
    }
    networkRetryCountRef.current = 0;
    try {
      if (!options?.skipServerLogout) {
        await authApi.logout();
      }
    } catch (logoutError) {
      if (isBenignLogoutError(logoutError)) {
        logger.info("[Auth] Logout skipped: session already cleared.");
      } else {
        logger.error("[Auth] Logout failed:", logoutError);
      }
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        localStorage.removeItem("esparex_fcm_token");
        localStorage.removeItem("esparex_fcm_registration_v1");
      }
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
      setHasAuthHint(false);
      wasAuthenticatedRef.current = false;
      authBannerShownRef.current = false;
      staleSessionCleanupRef.current = false;
    }
  }, [setHasAuthHint]);

  /* ------------------------------------------------------------------------ */
  /* Provider Values                                                          */
  /* ------------------------------------------------------------------------ */

  const statusValue = useMemo<AuthStatusContextType>(
    () => ({
      status,
      isAuthResolved: status !== "loading",
      error,
      refreshUser: fetchUser,
      logout,
    }),
    [error, fetchUser, logout, status]
  );

  const userValue = useMemo<AuthUserContextType>(
    () => ({
      user,
      updateUser,
    }),
    [user, updateUser]
  );

  const combinedValue = useMemo<AuthContextType>(
    () => ({
      user,
      status,
      isAuthResolved: status !== "loading",
      error,
      refreshUser: fetchUser,
      updateUser,
      logout,
    }),
    [error, fetchUser, logout, status, updateUser, user]
  );

  const backendReadyValue = useMemo(
    () => ({ backendReady }),
    [backendReady]
  );

  return (
    <BackendReadyContext.Provider value={backendReadyValue}>
      <AuthStatusContext.Provider value={statusValue}>
        <AuthUserContext.Provider value={userValue}>
          <AuthContext.Provider value={combinedValue}>
            {children}
          </AuthContext.Provider>
        </AuthUserContext.Provider>
      </AuthStatusContext.Provider>
    </BackendReadyContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

export function useAuthStatus(): AuthStatusContextType {
  const ctx = useContext(AuthStatusContext);
  if (!ctx) throw new Error("useAuthStatus must be used within AuthProvider");
  return ctx;
}

export function useAuthUser(): AuthUserContextType {
  const ctx = useContext(AuthUserContext);
  if (!ctx) throw new Error("useAuthUser must be used within AuthProvider");
  return ctx;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}

export function useBackendReady(): boolean {
  const ctx = useContext(BackendReadyContext);
  if (!ctx) throw new Error("useBackendReady must be used within AuthProvider");
  return ctx.backendReady;
}
