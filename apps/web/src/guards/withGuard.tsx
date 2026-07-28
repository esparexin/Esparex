"use client";

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser as useUser } from '@/hooks/useCurrentUser';
import { User } from '@/types/User';
import logger from "@/lib/logger";
import { buildAuthCallbackUrl, buildLoginUrl, consumeLogoutRedirectBypass } from "@/lib/authHelpers";

type GuardFunction = (user: User) => void;

export function withGuard<P extends object>(
    Component: React.ComponentType<P>,
    guard: GuardFunction
) {
        return function Guarded(props: P) {
            const router = useRouter();
            const pathname = usePathname();
            const searchParams = useSearchParams();
            const { user, loading: isLoading } = useUser();
        const authorized = useMemo(() => {
            if (!user) return false;
            try {
                guard(user);
                return true;
            } catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                if (message === "BUSINESS_ACCESS_DENIED" || message === "AUTH_REQUIRED") {
                    logger.debug(`[Guard] Access restricted for user (${user.id || 'guest'}): ${message}`);
                } else {
                    logger.error("[Guard] Unexpected error during authorization check:", e);
                }
                return false;
            }
        }, [user]);

        useEffect(() => {
            if (!user && !isLoading) {
                if (consumeLogoutRedirectBypass()) {
                    void router.replace('/');
                    return;
                }
                const callbackUrl = buildAuthCallbackUrl(pathname || "/", searchParams);
                void router.replace(buildLoginUrl(callbackUrl));
                return;
            }

            if (user && !authorized) {
                // Canonical User State Destination Matrix:
                // Normal User / Pending / Rejected -> Redirect to /account/business/apply (renders registration / pending / reapply UI)
                void router.replace('/account/business/apply');
            }
        }, [user, isLoading, authorized, router, pathname, searchParams]);

        if (isLoading) return null;
        if (!authorized) return null;

        return <Component {...props} />;
    };
}
