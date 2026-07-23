"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from "react";

import { useRouter } from "next/navigation";
import type { User } from "@/types/User";

import { normalizeError } from "@/lib/api/normalizeError";
import { authApi } from "@/lib/api/auth";
import logger from "@/lib/logger";

import {
  AUTH_SESSION_STORAGE_KEY,
  isValidUser,
  isBenignLogoutError,
  replaceToHomeSafely,
} from "./auth/authHelpers";
import { useBackendReadyPoller } from "./auth/useBackendReadyPoller";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "authenticated";

export interface AuthStatusContextType {
  status: AuthStatus;
  isAuthResolved: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
  logout: (options?: { skipServerLogout?: boolean }) => Promise<void>;
}

export interface AuthUserContextType {
  user: User | null;
  updateUser: (user: User) => void;
}

export interface AuthContextType extends AuthStatusContextType, AuthUserContextType {}

interface BackendReadyContextType {
  backendReady: boolean;
}

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

  /* ------------------------------------------------------------------------ */
  /* Fetch User                                                               */
  /* ------------------------------------------------------------------------ */

  const fetchUser = useCallback(async function doFetch(): Promise<void> {
    /* ---------------- Dev Bypass ---------------- */

    if (!backendReady) {
      if (
        process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH === "true" &&
        process.env.NODE_ENV !== "production"
      ) {
        logger.warn("⚠️ LOCAL DEV AUTH ENABLED — DO NOT DEPLOY");

        const devUser: User = {
          id: "local-dev-user",
          name: "Local Dev User",
          email: "dev@localhost",
          mobile: "9999999999",
          role: "user",
          isPhoneVerified: true,
          businessStatus: "pending",
          createdAt: new Date().toISOString(),
        };

        setUser(devUser);
        setStatus("authenticated");
        setBackendReady(true);
        setError(null);

        return;
      }

      setStatus("loading");
      return;
    }

    /* ---------------- Idempotency ---------------- */

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setStatus("loading");

    try {
      const response = await authApi.me({ silent: true });
      const rawUser = response.user;

      if (isValidUser(rawUser)) {
        setUser(rawUser);
        setStatus("authenticated");
        setError(null);
        setHasAuthHint(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_SESSION_STORAGE_KEY, "1");
        }
        authBannerShownRef.current = false;
        wasAuthenticatedRef.current = true;
        staleSessionCleanupRef.current = false;
      } else {
        setUser(null);
        setStatus("unauthenticated");
        setHasAuthHint(false);
      }
    } catch (rawError: unknown) {
      const err = normalizeError(rawError);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        if (!staleSessionCleanupRef.current) {
          staleSessionCleanupRef.current = true;
          try {
            await authApi.logout();
          } catch {
            // Ignore cleanup failures
          }
        }

        if (typeof window !== "undefined") {
          localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        }

        setUser(null);
        setStatus("unauthenticated");
        setError(null);
        setHasAuthHint(false);
        const hadActiveSession = wasAuthenticatedRef.current;
        wasAuthenticatedRef.current = false;
        if (hadActiveSession && !authBannerShownRef.current) {
          authBannerShownRef.current = true;
          replaceToHomeSafely(routerRef.current);
        }

        return;
      }

      if (!err.response) {
        const MAX_NETWORK_RETRIES = 3;
        if (networkRetryCountRef.current < MAX_NETWORK_RETRIES) {
          networkRetryCountRef.current += 1;
          const delay = networkRetryCountRef.current * 5_000;
          if (process.env.NODE_ENV === "development") {
            logger.warn(`[Auth] Network error — retrying in ${delay / 1000}s (attempt ${networkRetryCountRef.current}/${MAX_NETWORK_RETRIES})`);
          }
          networkRetryTimerRef.current = setTimeout(() => {
            fetchingRef.current = false;
            void doFetch();
          }, delay);
          return;
        }
        networkRetryCountRef.current = 0;
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      if (
        err.isExpected ||
        err.response?.status === 429
      ) {
        setUser(null);
        setStatus("unauthenticated");
        setError(null);

        return;
      }

      if (process.env.NODE_ENV === "development") {
        logger.error("[Auth] Fetch failed:", err.message);
      }

      setError(
        new Error(
          err.message || "Authentication failed"
        )
      );

      setUser(null);
      setStatus("unauthenticated");
      setHasAuthHint(false);
    } finally {
      fetchingRef.current = false;
    }
  }, [backendReady, setBackendReady, setHasAuthHint]);

  /* ------------------------------------------------------------------------ */
  /* Session Sync                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!backendReady) return;

    const pathname = window.location.pathname;

    if (pathname.startsWith("/admin")) {
      setTimeout(() => {
        setStatus((prev) =>
          prev === "loading" ? "unauthenticated" : prev
        );
      }, 0);
      return;
    }

    const handleAuthUpdate = () => {
      if (!pathname.startsWith("/admin")) {
        fetchUser();
      }
    };

    if (!hasAuthHint) {
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
      return;
    }

    fetchUser();

    window.addEventListener(
      "esparex_auth_update",
      handleAuthUpdate
    );

    return () => {
      window.removeEventListener(
        "esparex_auth_update",
        handleAuthUpdate
      );
    };
  }, [backendReady, fetchUser, hasAuthHint]);

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
    } catch (error) {
      if (isBenignLogoutError(error)) {
        logger.info("[Auth] Logout skipped: session already cleared.");
      } else {
        logger.error("[Auth] Logout failed:", error);
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
