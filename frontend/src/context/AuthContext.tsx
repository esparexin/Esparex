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

import { apiClient } from "@/lib/api/client";
import { isAPIError } from "@/lib/api/APIError";
import { normalizeError } from "@/lib/api/normalizeError";
import { authApi } from "@/lib/api/auth";
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
  logout: (options?: { skipServerLogout?: boolean }) => Promise<void>;
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

function isBenignLogoutError(error: unknown): boolean {
  if (!isAPIError(error)) return false;

  if (error.status !== 401) return false;

  const backendMessage = String(
    error.context?.backendErrorMessage ??
      (typeof error.details === "object" && error.details !== null && "error" in error.details
        ? (error.details as { error?: unknown }).error
        : "") ??
      ""
  ).toLowerCase();

  return backendMessage.includes("no token") || error.message.toLowerCase().includes("no token");
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
  const router = useRouter();
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
  const networkRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const networkRetryCountRef = useRef(0);

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
          router.replace("/");
        }

        return;
      }

      /* Network error — backend is sleeping (Render free tier) or unreachable.
         Do NOT treat this as a session expiry. Stay in "loading" and retry so
         the user isn't kicked to the login page just because the backend is cold. */
      if (!err.response) {
        const MAX_NETWORK_RETRIES = 3;
        if (networkRetryCountRef.current < MAX_NETWORK_RETRIES) {
          networkRetryCountRef.current += 1;
          const delay = networkRetryCountRef.current * 5_000; // 5s, 10s, 15s
          if (process.env.NODE_ENV === "development") {
            logger.warn(`[Auth] Network error — retrying in ${delay / 1000}s (attempt ${networkRetryCountRef.current}/${MAX_NETWORK_RETRIES})`);
          }
          networkRetryTimerRef.current = setTimeout(() => {
            fetchingRef.current = false;
            void fetchUser();
          }, delay);
          // Stay in "loading" — withGuard shows null, no login redirect
          return;
        }
        // Give up after MAX_NETWORK_RETRIES — backend is genuinely down
        networkRetryCountRef.current = 0;
        setUser(null);
        setStatus("unauthenticated");
        // Preserve hasAuthHint so next page load re-attempts without requiring re-login
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
  }, [backendReady, router]);

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
