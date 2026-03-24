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

import type { User } from "@/types/User";

import { apiClient } from "@/lib/api/client";
import { normalizeError } from "@/lib/api/normalizeError";
import { authApi } from "@/lib/api/auth";
import { emitAppError } from "@/components/common/AppErrorBanner";
import logger from "@/lib/logger";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "authenticated";

const AUTH_SESSION_STORAGE_KEY = "esparex_user_session";

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  /** true once status has settled to either "authenticated" or "unauthenticated" */
  isAuthResolved: boolean;
  error: Error | null;
  backendReady: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function isValidUser(data: unknown): data is User {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<User>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.mobile === "string" &&
    typeof candidate.role === "string"
  );
}

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
  const [user, setUser] =
    useState<User | null>(null);

  const [status, setStatus] =
    useState<AuthStatus>("loading");

  const [error, setError] =
    useState<Error | null>(null);

  const [backendReady, setBackendReady] =
    useState(false);
  const [hasAuthHint, setHasAuthHint] =
    useState(() => {
      if (initialHasAuthCookie) return true;
      if (typeof window === "undefined") return false;
      return localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === "1";
    });

  const fetchingRef = useRef(false);
  const authBannerShownRef = useRef(false);
  const wasAuthenticatedRef = useRef(false);
  const staleSessionCleanupRef = useRef(false);

  /* ------------------------------------------------------------------------ */
  /* Fetch User                                                               */
  /* ------------------------------------------------------------------------ */

  const fetchUser = useCallback(async () => {
    /* ---------------- Dev Bypass ---------------- */

    if (!backendReady) {
      if (
        process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH ===
        "true" &&
        process.env.NODE_ENV !== "production"
      ) {
        logger.warn(
          "⚠️ LOCAL DEV AUTH ENABLED — DO NOT DEPLOY"
        );

        /* ✅ FIXED DEV USER */
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

      /* Normalize API Shapes */
      // authApi.me() returns { success: boolean, user: User }
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

      /* Auth failures are valid states */
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        // One-time stale-session cleanup for invalid/blacklisted HttpOnly cookies.
        if (!staleSessionCleanupRef.current) {
          staleSessionCleanupRef.current = true;
          try {
            await authApi.logout();
          } catch {
            // Ignore cleanup failures; UI still transitions to unauthenticated.
          }
        }

        if (typeof window !== "undefined") {
          localStorage.removeItem(
            "esparex_access_token"
          );
          localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        }

        setUser(null);
        setStatus("unauthenticated");
        setError(null);
        setHasAuthHint(false);
        const hadActiveSession = wasAuthenticatedRef.current;
        wasAuthenticatedRef.current = false;
        if (hadActiveSession && !authBannerShownRef.current) {
          emitAppError("Your session has expired. Please log in again.");
          authBannerShownRef.current = true;
        }

        return;
      }

      /* Rate limit / boot noise */
      if (
        err.isExpected ||
        err.response?.status === 429
      ) {
        setUser(null);
        setStatus("unauthenticated");
        setError(null);

        return;
      }

      if (
        process.env.NODE_ENV === "development"
      ) {
        logger.error(
          "[Auth] Fetch failed:",
          err.message
        );
      }

      /* ✅ FIXED ERROR TYPE */
      setError(
        new Error(
          err.message ||
          "Authentication failed"
        )
      );

      setUser(null);
      setStatus("unauthenticated");
      setHasAuthHint(false);
    } finally {
      fetchingRef.current = false;
    }
  }, [backendReady]);

  /* ------------------------------------------------------------------------ */
  /* Backend Health Check                                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;
    const RETRY_DELAY_MS = 10_000;

    if (
      process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH ===
      "true" &&
      process.env.NODE_ENV !== "production"
    ) {
      setBackendReady(true);
      return;
    }

    const waitForBackend = async () => {
      try {
        const ok = await apiClient.checkHealth();

        if (mounted && ok) {
          setBackendReady(true);
        } else if (mounted) {
          setTimeout(waitForBackend, RETRY_DELAY_MS);
        }
      } catch {
        if (mounted) {
          setTimeout(waitForBackend, RETRY_DELAY_MS);
        }
      }
    };

    waitForBackend();

    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Session Sync                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!backendReady) return;

    const pathname = window.location.pathname;

    if (pathname.startsWith("/admin")) {
      setStatus((prev) =>
        prev === "loading" ? "unauthenticated" : prev
      );
      return;
    }

    // Force a fetch if a business update event occurs
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
    []
  );

  /* ------------------------------------------------------------------------ */
  /* Logout                                                                   */
  /* ------------------------------------------------------------------------ */

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      logger.error("[Auth] Logout failed:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("esparex_access_token");
        localStorage.removeItem("esparex_user_session");
      }
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
      setHasAuthHint(false);
      wasAuthenticatedRef.current = false;
      authBannerShownRef.current = false;
      staleSessionCleanupRef.current = false;
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Provider                                                                 */
  /* ------------------------------------------------------------------------ */

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthResolved: status !== "loading",
      error,
      backendReady,
      refreshUser: fetchUser,
      updateUser,
      logout,
    }),
    [backendReady, error, fetchUser, logout, status, updateUser, user]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}
