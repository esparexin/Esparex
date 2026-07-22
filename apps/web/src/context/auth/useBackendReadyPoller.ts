"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { AUTH_SESSION_STORAGE_KEY } from "./authHelpers";

export function useBackendReadyPoller(initialHasAuthCookie = false) {
  const [backendReady, setBackendReady] = useState(false);
  const [hasAuthHint, setHasAuthHint] = useState(initialHasAuthCookie);

  useEffect(() => {
    if (initialHasAuthCookie || typeof window === "undefined") return;

    if (localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === "1") {
      setHasAuthHint(true);
    }
  }, [initialHasAuthCookie]);

  useEffect(() => {
    let mounted = true;

    if (
      process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH === "true" &&
      process.env.NODE_ENV !== "production"
    ) {
      setBackendReady(true);
      return;
    }

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
  }, []);

  return { backendReady, setBackendReady, hasAuthHint, setHasAuthHint };
}
