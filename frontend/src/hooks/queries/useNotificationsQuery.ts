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
        refetchOnWindowFocus: true, // Keep manual fallback refresh
        refetchOnReconnect: true    // Keep network reconnect refresh
    });
