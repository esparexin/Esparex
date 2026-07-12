import { useQuery } from "@tanstack/react-query";

import { notificationApi } from "@/lib/api/user/notifications";
import { queryKeys } from "./queryKeys";

interface UseNotificationsQueryOptions {
    page?: number;
    limit?: number;
    filter?: "all" | "unread";
    type?: string;
    q?: string;
    enabled?: boolean;
}

export const useNotificationsQuery = ({
    page = 1,
    limit = 20,
    filter = "all",
    type = "all",
    q = "",
    enabled = true,
}: UseNotificationsQueryOptions = {}) =>
    useQuery({
        queryKey: queryKeys.notifications.list({ page, limit, filter, type, q }),
        queryFn: () => notificationApi.getAll({ page, limit, filter, type, q }),
        enabled, // Restored enabled usage to respect SSR rules
        staleTime: 5 * 60 * 1000,  // 5 min — throttles refetchOnWindowFocus so it only fires after data is actually stale
        refetchOnWindowFocus: true, // Intentional: refreshes unread badge when user returns to the tab
        refetchOnReconnect: true    // Intentional: refreshes after network reconnect
    });
