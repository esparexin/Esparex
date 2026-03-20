"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useSavedAdsQuery } from "@/queries/useAdsQuery";
import { queryKeys } from "@/queries/queryKeys";
import { useNotificationsQuery } from "@/queries/useNotificationsQuery";
import type { User } from "@/types/User";

export function AppBootstrapProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { user, status } = useAuth();
    const pathname = usePathname();

    const shouldPrefetchAccountWidgets =
        status === "authenticated" &&
        !pathname?.startsWith("/account/business/apply") &&
        !pathname?.startsWith("/business/edit");

    useNotificationsQuery({
        page: 1,
        limit: 20,
        enabled: shouldPrefetchAccountWidgets,
    });
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
        }
    }, [queryClient, status, user]);

    return <>{children}</>;
}
