"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginFlow } from "@/components/auth/LoginFlow";
import { normalizeAuthCallbackUrl } from "@/lib/authHelpers";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    return normalizeAuthCallbackUrl(raw);
  }, [searchParams]);

  const handleDismiss = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    void router.replace("/");
  }, [router]);

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-8 bg-slate-50">
      <LoginFlow
        mode="modal"
        callbackUrl={callbackUrl}
        onClose={handleDismiss}
        onBack={handleDismiss}
      />
    </div>
  );
}
