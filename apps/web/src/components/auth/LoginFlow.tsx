"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@esparex/ui";
import { Login } from "@/components/user/Login";
import { useAuth } from "@/context/AuthContext";
import { normalizeAuthCallbackUrl } from "@/lib/authHelpers";

// Boundary (Phase 8): modal orchestration (callback/redirect) around user/Login
// (form/OTP). Layered composition, not duplication — keep both. Entry: AuthModal.
interface LoginFlowProps {
  callbackUrl?: string | null;
  mode?: "modal";
  onClose?: () => void;
  onBack?: () => void;
  onRegisterBackAction?: (action: (() => void) | null) => void;
}

export function LoginFlow({
  callbackUrl,
  onClose,
  onBack,
  onRegisterBackAction,
}: LoginFlowProps) {
  const router = useRouter();
  const { status } = useAuth();
  const safeCallbackUrl = useMemo(
    () => normalizeAuthCallbackUrl(callbackUrl),
    [callbackUrl]
  );

  const [isRedirecting, setIsRedirecting] = useState(false);
  const showRedirectOverlay = isRedirecting && status !== "unauthenticated";

  const handleLoginSuccess = useCallback(
    () => {
      setIsRedirecting(true);
      onClose?.();
      void router.push(safeCallbackUrl);
    },
    [safeCallbackUrl, onClose, router]
  );

  return (
    <div className="relative flex flex-col">
      <Login
        onLoginSuccess={handleLoginSuccess}
        onBack={onBack}
        onRegisterBackAction={onRegisterBackAction}
      />

      {showRedirectOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="space-y-3 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-body text-muted-foreground">
              Setting up your account...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
