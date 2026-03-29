"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useSavedAdsQuery } from "@/hooks/queries/useListingsQuery";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { ensureForegroundPushListener, syncBrowserPushRegistration, clearBrowserPushCache } from "@/lib/notifications/webPush";
import type { User } from "@/types/User";

export function AppBootstrapProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { user, status } = useAuth();
    const pathname = usePathname();

    const shouldPrefetchAccountWidgets =
        status === "authenticated" &&
        !pathname?.startsWith("/account/business/apply") &&
        !pathname?.startsWith("/business/edit");

    useSavedAdsQuery({
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
