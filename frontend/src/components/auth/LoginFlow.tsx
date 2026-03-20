"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Login } from "@/components/user/Login";
import { useAuth } from "@/context/AuthContext";
import { normalizeAuthCallbackUrl } from "@/utils/authHelpers";

interface LoginFlowProps {
  callbackUrl?: string | null;
  mode?: "page" | "modal";
  onClose?: () => void;
  onBack?: () => void;
}

export function LoginFlow({
  callbackUrl,
  mode = "page",
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

  const handleLoginSuccess = useCallback(
    (options?: { requiresProfileSetup?: boolean }) => {
      const requiresProfileSetup =
        options?.requiresProfileSetup === true;

      const target = requiresProfileSetup
        ? "/account/profile"
        : safeCallbackUrl;

      setIsRedirecting(true);
      onClose?.();
      void router.replace(target);
    },
    [safeCallbackUrl, onClose, router]
  );

  useEffect(() => {
    if (isRedirecting) return;
    // Do not redirect while auth is still resolving (SSR hydration guard).
    if (status === "loading" || status !== "authenticated") return;
    onClose?.();
    void router.replace(safeCallbackUrl);
  }, [isRedirecting, status, safeCallbackUrl, onClose, router]);

  return (
    <div className="relative">
      <Login
        mode={mode}
        onLoginSuccess={handleLoginSuccess}
        onBack={onBack ?? (mode === "page" ? () => void router.push("/") : undefined)}
      />

      {isRedirecting && status !== "unauthenticated" && (
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
