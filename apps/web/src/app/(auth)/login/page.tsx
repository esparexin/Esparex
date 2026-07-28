"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";
import { normalizeAuthCallbackUrl } from "@/lib/authHelpers";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showLogin } = useAuthModal();
  const hasTriggeredRef = useRef(false);

  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    return normalizeAuthCallbackUrl(raw);
  }, [searchParams]);

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    // Trigger canonical global AuthModal
    showLogin(callbackUrl);

    // Soft redirect back to target destination or home feed
    const targetUrl = callbackUrl && callbackUrl !== "/login" ? callbackUrl : "/";
    router.replace(targetUrl);
  }, [callbackUrl, router, showLogin]);

  return null;
}
