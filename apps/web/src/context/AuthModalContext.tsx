"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

interface AuthModalContextType {
  isAuthModalOpen: boolean;
  showLogin: (callbackUrl?: string) => void;
  hideLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  const showLogin = useCallback((url?: string) => {
    if (url) setCallbackUrl(url);
    setIsOpen(true);
  }, []);

  const hideLogin = useCallback(() => {
    setIsOpen(false);
    // Optional: reset callback url after animation finishes, but keeping it is fine too.
  }, []);

  const value = useMemo(
    () => ({ isAuthModalOpen: isOpen, showLogin, hideLogin }),
    [isOpen, showLogin, hideLogin]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        open={isOpen}
        onOpenChange={setIsOpen}
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
