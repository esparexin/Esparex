"use client";

import React, { createContext, useContext, useCallback, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth/AuthModal";
import { normalizeAuthCallbackUrl } from "@/lib/authHelpers";
import { useBottomSheetManager } from "@/context/BottomSheetManagerContext";

interface AuthModalContextType {
  isAuthModalOpen: boolean;
  showLogin: (callbackUrl?: string) => void;
  hideLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

function AuthModalQueryWatcher({ onLoginParam }: { onLoginParam: (param: string | null) => void }) {
  const searchParams = useSearchParams();
  const loginParam = searchParams?.get("login");
  const callbackUrlParam = searchParams?.get("callbackUrl");
  useEffect(() => {
    if (loginParam === "true") onLoginParam(callbackUrlParam);
  }, [loginParam, callbackUrlParam, onLoginParam]);
  return null;
}

function cleanupLoginUrl() {
  if (typeof window === "undefined" || !window.location.search.includes("login=true")) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("login");
  url.searchParams.delete("callbackUrl");
  const cleanSearch = url.searchParams.toString();
  window.history.replaceState({}, "", `${url.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${url.hash}`);
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const { activeSheetId, registerSheet, unregisterSheet, openSheet, closeSheet } = useBottomSheetManager();
  const [callbackUrl, setCallbackUrl] = React.useState<string | null>(null);

  useEffect(() => {
    registerSheet("auth", {
      onClose: () => {
        cleanupLoginUrl();
        setCallbackUrl(null);
      },
    });
    return () => unregisterSheet("auth");
  }, [registerSheet, unregisterSheet]);

  const handleLoginParam = useCallback((param: string | null) => {
    setCallbackUrl(normalizeAuthCallbackUrl(param));
    openSheet("auth");
  }, [openSheet]);

  const showLogin = useCallback((url?: string) => {
    setCallbackUrl(url ? normalizeAuthCallbackUrl(url) : "/");
    openSheet("auth");
  }, [openSheet]);

  const hideLogin = useCallback(() => closeSheet("auth"), [closeSheet]);
  const isAuthModalOpen = activeSheetId === "auth";
  const handleOpenChange = useCallback((open: boolean) => (open ? openSheet("auth") : hideLogin()), [hideLogin, openSheet]);

  const value = useMemo(() => ({ isAuthModalOpen, showLogin, hideLogin }), [isAuthModalOpen, showLogin, hideLogin]);

  return (
    <AuthModalContext.Provider value={value}>
      <Suspense fallback={null}>
        <AuthModalQueryWatcher onLoginParam={handleLoginParam} />
      </Suspense>
      {children}
      <AuthModal open={isAuthModalOpen} onOpenChange={handleOpenChange} callbackUrl={callbackUrl} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) throw new Error("useAuthModal must be used within an AuthModalProvider");
  return context;
}