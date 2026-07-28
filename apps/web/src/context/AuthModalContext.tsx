"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth/AuthModal";
import { normalizeAuthCallbackUrl } from "@/lib/authHelpers";

interface AuthModalContextType {
  isAuthModalOpen: boolean;
  showLogin: (callbackUrl?: string) => void;
  hideLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Synchronize /login URL with AuthModal state
  useEffect(() => {
    if (pathname === "/login") {
      const raw = searchParams?.get("callbackUrl");
      const normalized = normalizeAuthCallbackUrl(raw);
      if (normalized && normalized !== "/") {
        setCallbackUrl(normalized);
      }
      setIsOpen(true);
    }
  }, [pathname, searchParams]);

  const showLogin = useCallback((url?: string) => {
    if (url) setCallbackUrl(url);
    setIsOpen(true);
  }, []);

  const hideLogin = useCallback(() => {
    setIsOpen(false);
    if (pathname === "/login") {
      router.replace("/");
    }
  }, [pathname, router]);

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
