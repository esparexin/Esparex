"use client";

"use client";
import { useEffect, ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { buildAuthCallbackUrl, buildLoginUrl, consumeLogoutRedirectBypass } from "@/lib/authHelpers";

interface AuthGuardProps {
    children: ReactNode;
}

export function AuthGuard({
    children
}: AuthGuardProps) {
    const { user, status } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // 1. Wait for loading
        if (status === "loading") return;

        // 2. Unauthenticated check
        if (status === "unauthenticated" || !user) {
            if (consumeLogoutRedirectBypass()) {
                void router.replace("/");
                return;
            }
            const callbackUrl = buildAuthCallbackUrl(pathname || "/", searchParams);
            void router.replace(buildLoginUrl(callbackUrl));
            return;
        }
    }, [status, user, router, pathname, searchParams]);

    // Render checks (passive only)
    if (status === "loading") return null;
    if (!user) return null;

    return <>{children}</>;
}
