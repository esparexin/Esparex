"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { AUTH_SESSION_STORAGE_KEY } from "./authHelpers";

export function useBackendReadyPoller(initialHasAuthCookie = false) {
  const isLocalDevAuth =
    process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH === "true" &&
    process.env.NODE_ENV !== "production";

  const [backendReady, setBackendReady] = useState(isLocalDevAuth);
  const [hasAuthHint, setHasAuthHint] = useState(() => {
    if (initialHasAuthCookie) return true;
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === "1";
      } catch {
        return false;
      }
    }
    return false;
  });

  const [prevInitialAuth, setPrevInitialAuth] = useState(initialHasAuthCookie);
  if (prevInitialAuth !== initialHasAuthCookie) {
    setPrevInitialAuth(initialHasAuthCookie);
    if (initialHasAuthCookie) {
      setHasAuthHint(true);
    }
  }

  useEffect(() => {
    if (isLocalDevAuth) return;

    let mounted = true;

    const BASE_DELAY_MS = 2_000;
    const MAX_DELAY_MS = 30_000;
    let retryAttempt = 0;

    const waitForBackend = async () => {
      try {
        const ok = await apiClient.checkHealth();

        if (mounted && ok) {
          retryAttempt = 0;
          setBackendReady(true);
        } else if (mounted) {
          const jitter = Math.random() * 1_000;
          const delay =
            Math.min(BASE_DELAY_MS * Math.pow(2, retryAttempt), MAX_DELAY_MS) +
            jitter;
          retryAttempt += 1;
          setTimeout(waitForBackend, delay);
        }
      } catch {
        if (mounted) {
          const jitter = Math.random() * 1_000;
          const delay =
            Math.min(BASE_DELAY_MS * Math.pow(2, retryAttempt), MAX_DELAY_MS) +
            jitter;
          retryAttempt += 1;
          setTimeout(waitForBackend, delay);
        }
      }
    };

    waitForBackend();

    return () => {
      mounted = false;
    };
  }, [isLocalDevAuth]);

  return { backendReady, setBackendReady, hasAuthHint, setHasAuthHint };
}
