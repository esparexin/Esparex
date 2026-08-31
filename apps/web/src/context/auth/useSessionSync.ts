import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { User } from "@/types/User";
import type { AuthStatus } from "./authTypes";

interface UseSessionSyncParams {
  backendReady: boolean;
  hasAuthHint: boolean;
  fetchUser: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
  setStatus: Dispatch<SetStateAction<AuthStatus>>;
  setError: Dispatch<SetStateAction<Error | null>>;
}

export function useSessionSync({
  backendReady,
  hasAuthHint,
  fetchUser,
  setUser,
  setStatus,
  setError,
}: UseSessionSyncParams) {
  const syncedRef = useRef<boolean>(false);

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
        void fetchUser();
      }
    };

    if (!hasAuthHint) {
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
      syncedRef.current = false;
      return;
    }

    if (!syncedRef.current) {
      syncedRef.current = true;
      void fetchUser();
    }

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
  }, [backendReady, fetchUser, hasAuthHint, setError, setStatus, setUser]);
}
