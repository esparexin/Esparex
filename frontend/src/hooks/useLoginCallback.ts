"use client";

/**
 * SSOT for login-callback URL logic shared by public page clients
 * (AdPageClient, ServicePageClient, BusinessPageClient, etc.)
 *
 * Handles two scenarios:
 *  1. Pre-login: builds `loginCallbackUrl` (current page → stored as callbackUrl
 *     query param when redirecting to /login).
 *  2. Post-login: reads `callbackUrl` from search params and provides
 *     `navigateBack` so the page can return the user to their original destination.
 */

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { normalizeAuthCallbackUrl } from "@/utils/authHelpers";

export interface UseLoginCallbackReturn {
    /** The return URL to embed in `/login?callbackUrl=…` (current page, callbackUrl stripped) */
    loginCallbackUrl: string;
    /** The post-login destination stored in the current URL's callbackUrl param (if any) */
    returnUrl: string | null;
    /** Navigate back: follow returnUrl if present, otherwise call fallback or router.back() */
    navigateBack: (fallback?: () => void) => void;
    /** Redirect to /login with the current page stored as the callbackUrl */
    handleShowLogin: () => void;
}

export function useLoginCallback(): UseLoginCallbackReturn {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Build the URL to pass as callbackUrl to /login  (strip any existing callbackUrl param)
    const loginCallbackUrl = useMemo(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("callbackUrl");
        const query = params.toString();
        const raw = query ? `${pathname}?${query}` : pathname;
        return normalizeAuthCallbackUrl(raw);
    }, [pathname, searchParams]);

    // Read a post-login redirect destination already embedded in the current URL
    const returnUrl = useMemo(() => {
        const raw = searchParams.get("callbackUrl");
        if (!raw) return null;
        return normalizeAuthCallbackUrl(raw);
    }, [searchParams]);

    const navigateBack = (fallback?: () => void) => {
        if (returnUrl) {
            // replace: login page must not remain in the history stack
            void router.replace(returnUrl);
            return;
        }
        if (fallback) {
            fallback();
        } else {
            router.back();
        }
    };

    const handleShowLogin = () => {
        void router.push(
            `/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`
        );
    };

    return { loginCallbackUrl, returnUrl, navigateBack, handleShowLogin };
}
