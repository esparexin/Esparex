"use client";

/**
 * SSOT for login-callback URL logic shared by public page clients
 * (AdPageClient, ServicePageClient, BusinessPageClient, etc.)
 */

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { buildAuthCallbackUrl, normalizeAuthCallbackUrl } from "@/lib/authHelpers";
import { useAuthModal } from "@/context/AuthModalContext";

export interface UseLoginCallbackReturn {
    /** The return URL for post-login actions (current page, callbackUrl stripped) */
    loginCallbackUrl: string;
    /** The post-login destination stored in the current URL's callbackUrl param (if any) */
    returnUrl: string | null;
    /** Navigate back: follow returnUrl if present, otherwise call fallback or router.back() */
    navigateBack: (fallback?: () => void) => void;
    /** Open global AuthModal with the current page stored as the callbackUrl */
    handleShowLogin: () => void;
}

export function useLoginCallback(): UseLoginCallbackReturn {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { showLogin } = useAuthModal();

    // Build the URL to pass as callbackUrl to AuthModal (strip any existing callbackUrl param)
    const loginCallbackUrl = useMemo(() => {
        return buildAuthCallbackUrl(pathname, searchParams);
    }, [pathname, searchParams]);

    // Read a post-login redirect destination already embedded in the current URL
    const returnUrl = useMemo(() => {
        const raw = searchParams.get("callbackUrl");
        if (!raw) return null;
        return normalizeAuthCallbackUrl(raw);
    }, [searchParams]);

    const navigateBack = useCallback((fallback?: () => void) => {
        if (returnUrl) {
            void router.replace(returnUrl);
            return;
        }
        if (fallback) {
            fallback();
        } else {
            router.back();
        }
    }, [returnUrl, router]);

    const handleShowLogin = useCallback(() => {
        showLogin(loginCallbackUrl);
    }, [loginCallbackUrl, showLogin]);

    return { loginCallbackUrl, returnUrl, navigateBack, handleShowLogin };
}
