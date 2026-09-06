"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@esparex/ui";
import { Login } from "@/components/user/Login";
import { useAuth } from "@/context/AuthContext";
import { normalizeAuthCallbackUrl } from "@/lib/authHelpers";

interface LoginFlowProps {
  callbackUrl?: string | null;
  mode?: "page" | "modal";
  onClose?: () => void;
  onBack?: () => void;
}

export function LoginFlow({
  callbackUrl,
  mode = "modal",
  onClose,
  onBack,
}: LoginFlowProps) {
  const router = useRouter();
  const { status } = useAuth();
  const safeCallbackUrl = useMemo(
    () => normalizeAuthCallbackUrl(callbackUrl),
    [callbackUrl]
  );

  const [isRedirecting, setIsRedirecting] = useState(false);

  const isAutoRedirecting = mode === "page" && status === "authenticated";
  const showRedirectOverlay = (isRedirecting || isAutoRedirecting) && status !== "unauthenticated";

  const handleLoginSuccess = useCallback(
    () => {
      setIsRedirecting(true);
      onClose?.();
      void router.push(safeCallbackUrl);
    },
    [safeCallbackUrl, onClose, router]
  );

  useEffect(() => {
    // Page mode auto-redirect guard if already authenticated when visiting /login page directly
    if (mode === "page" && status === "authenticated") {
      void router.push(safeCallbackUrl);
    }
  }, [mode, status, safeCallbackUrl, router]);

  return (
    <div className="relative">
      <Login
        mode={mode}
        onLoginSuccess={handleLoginSuccess}
        onBack={onBack ?? (mode === "page" ? () => void router.push("/") : undefined)}
      />

      {showRedirectOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="space-y-3 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Setting up your account...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
