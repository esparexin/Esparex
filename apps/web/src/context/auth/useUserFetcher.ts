import { useCallback, useEffect, useRef, type MutableRefObject, type Dispatch, type SetStateAction } from "react";
import type { useRouter } from "next/navigation";
import type { User } from "@/types/User";
import type { AuthStatus } from "./authTypes";
import { normalizeError } from "@/lib/api/normalizeError";
import { authApi } from "@/lib/api/auth";
import logger from "@/lib/logger";
import {
  AUTH_SESSION_STORAGE_KEY,
  isValidUser,
  getDevUser,
  cleanupUnauthorizedSession,
} from "./authHelpers";

type RouterInstance = ReturnType<typeof useRouter>;

interface UseUserFetcherParams {
  backendReady: boolean;
  setBackendReady: (ready: boolean) => void;
  setHasAuthHint: (hint: boolean) => void;
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  setStatus: Dispatch<SetStateAction<AuthStatus>>;
  setError: Dispatch<SetStateAction<Error | null>>;
  routerRef: MutableRefObject<RouterInstance>;
  fetchingRef: MutableRefObject<boolean>;
  authBannerShownRef: MutableRefObject<boolean>;
  wasAuthenticatedRef: MutableRefObject<boolean>;
  staleSessionCleanupRef: MutableRefObject<boolean>;
  networkRetryTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  networkRetryCountRef: MutableRefObject<number>;
}

export function useUserFetcher({
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
}: UseUserFetcherParams) {
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchUser = useCallback(async function doFetch(): Promise<void> {
    if (!backendReady) {
      if (process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH === "true" && process.env.NODE_ENV !== "production") {
        logger.warn("⚠️ LOCAL DEV AUTH ENABLED — DO NOT DEPLOY");
        setUser(getDevUser());
        setStatus("authenticated");
        setBackendReady(true);
        setError(null);
        return;
      }
      setStatus("loading");
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (!userRef.current) setStatus("loading");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await authApi.me({ silent: true, signal: controller.signal });
      if (controller.signal.aborted) return;
      const rawUser = response.user;

      if (isValidUser(rawUser)) {
        setUser(rawUser);
        setStatus("authenticated");
        setError(null);
        setHasAuthHint(true);
        if (typeof window !== "undefined") localStorage.setItem(AUTH_SESSION_STORAGE_KEY, "1");
        authBannerShownRef.current = false;
        wasAuthenticatedRef.current = true;
        staleSessionCleanupRef.current = false;
      } else {
        setUser(null);
        setStatus("unauthenticated");
        setHasAuthHint(false);
      }
    } catch (rawError: unknown) {
      if (controller.signal.aborted || (rawError as { name?: string })?.name === "AbortError") {
        return;
      }

      const err = normalizeError(rawError);

      if (err.response?.status === 401 || err.response?.status === 403) {
        const hadActiveSession = wasAuthenticatedRef.current;
        if (!staleSessionCleanupRef.current) {
          staleSessionCleanupRef.current = true;
          void cleanupUnauthorizedSession(routerRef.current, hadActiveSession && !authBannerShownRef.current);
          if (hadActiveSession) authBannerShownRef.current = true;
        }
        setUser(null);
        setStatus("unauthenticated");
        setError(null);
        setHasAuthHint(false);
        wasAuthenticatedRef.current = false;
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

      if (err.isExpected || err.response?.status === 429) {
        setUser(null);
        setStatus("unauthenticated");
        setError(null);
        return;
      }

      if (process.env.NODE_ENV === "development") {
        logger.error("[Auth] Fetch failed:", err.message);
      }

      setError(new Error(err.message || "Authentication failed"));
      setUser(null);
      setStatus("unauthenticated");
      setHasAuthHint(false);
    } finally {
      if (!controller.signal.aborted) {
        fetchingRef.current = false;
      }
    }
  }, [
    backendReady, setBackendReady, setHasAuthHint, setUser, setStatus, setError,
    routerRef, fetchingRef, authBannerShownRef, wasAuthenticatedRef,
    staleSessionCleanupRef, networkRetryTimerRef, networkRetryCountRef,
  ]);

  return { fetchUser };
}
