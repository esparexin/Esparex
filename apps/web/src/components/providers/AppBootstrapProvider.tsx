"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useSavedAdsQuery } from "@/hooks/queries/useListingsQuery";
import { useNotificationsQuery } from "@/hooks/queries/useNotificationsQuery";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { AUTH_SESSION_STORAGE_KEY } from "@/context/auth/authHelpers";
import { ensureForegroundPushListener, syncBrowserPushRegistration, clearBrowserPushCache } from "@/lib/notifications/webPush";
import { isNativeShell } from "@/lib/runtime/nativeShell";
import type { User } from "@/types/User";

export function AppBootstrapProvider({
    children,
    initialHasAuthCookie = false,
}: {
    children: ReactNode;
    initialHasAuthCookie?: boolean;
}) {
    const queryClient = useQueryClient();
    const { user, status } = useAuth();
    const pathname = usePathname();

    // PERF-004: Optimistic parallel post-auth prefetching.
    // When session cookie hint (initialHasAuthCookie) or localStorage session key is present,
    // prefetch saved ads and notifications concurrently alongside /me rather than sequentially waiting.
    const shouldPrefetchAccountWidgets = useMemo(() => {
        if (pathname?.startsWith("/account/business/apply") || pathname?.startsWith("/business/edit")) {
            return false;
        }

        if (status === "authenticated") {
            return true;
        }

        if (status === "loading") {
            if (initialHasAuthCookie) return true;
            if (typeof window !== "undefined" && localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === "1") {
                return true;
            }
        }

        return false;
    }, [pathname, status, initialHasAuthCookie]);

    useSavedAdsQuery({
        enabled: shouldPrefetchAccountWidgets,
    });

    useNotificationsQuery({
        page: 1,
        limit: 10,
        enabled: shouldPrefetchAccountWidgets,
    });

    useEffect(() => {
        if (status === "authenticated" && user) {
            queryClient.setQueryData<User>(queryKeys.user.me(), user);
            return;
        }

        if (status === "unauthenticated") {
            queryClient.removeQueries({ queryKey: queryKeys.user.all });
            queryClient.removeQueries({ queryKey: queryKeys.notifications.all });
            queryClient.removeQueries({ queryKey: queryKeys.ads.saved() });
            clearBrowserPushCache();
        }
    }, [queryClient, status, user]);

    useEffect(() => {
        if (status !== "authenticated" || !user) {
            return;
        }

        if (isNativeShell()) {
            clearBrowserPushCache();
            return;
        }

        void syncBrowserPushRegistration({
            user: user as User & { notificationSettings?: { pushNotifications?: boolean } },
            interactive: false,
        });

        void ensureForegroundPushListener(() => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        });
    }, [queryClient, status, user]);

    return <>{children}</>;
}
