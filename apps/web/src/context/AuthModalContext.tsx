"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth/AuthModal";
import { normalizeAuthCallbackUrl } from "@/lib/authHelpers";

interface AuthModalContextType {
  isAuthModalOpen: boolean;
  showLogin: (callbackUrl?: string) => void;
  hideLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

function AuthModalQueryWatcher({
  onLoginParam,
}: {
  onLoginParam: (callbackUrlParam: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const [prevQueryKey, setPrevQueryKey] = useState<string | null>(null);
  const loginParam = searchParams?.get("login");
  const callbackUrlParam = searchParams?.get("callbackUrl");
  const currentQueryKey = loginParam === "true" ? `login=true&cb=${callbackUrlParam || ""}` : null;

  if (currentQueryKey !== prevQueryKey) {
    setPrevQueryKey(currentQueryKey);
    if (currentQueryKey) {
      onLoginParam(callbackUrlParam);
    }
  }

  return null;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  const handleLoginParam = useCallback((callbackUrlParam: string | null) => {
    setCallbackUrl(normalizeAuthCallbackUrl(callbackUrlParam));
    setIsOpen(true);
  }, []);

  const showLogin = useCallback((url?: string) => {
    setCallbackUrl(url ? normalizeAuthCallbackUrl(url) : "/");
    setIsOpen(true);
  }, []);

  const hideLogin = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== "undefined" && window.location.search.includes("login=true")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      url.searchParams.delete("callbackUrl");
      const cleanSearch = url.searchParams.toString();
      const newUrl = `${url.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${url.hash}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        hideLogin();
      } else {
        setIsOpen(true);
      }
    },
    [hideLogin]
  );

  const value = useMemo(
    () => ({ isAuthModalOpen: isOpen, showLogin, hideLogin }),
    [isOpen, showLogin, hideLogin]
  );

  return (
    <AuthModalContext.Provider value={value}>
      <Suspense fallback={null}>
        <AuthModalQueryWatcher onLoginParam={handleLoginParam} />
      </Suspense>
      {children}
      <AuthModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        callbackUrl={callbackUrl}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
