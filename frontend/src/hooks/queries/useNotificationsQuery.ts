import { useQuery } from "@tanstack/react-query";

import { notificationApi } from "@/lib/api/user/notifications";
import { queryKeys } from "./queryKeys";

interface UseNotificationsQueryOptions {
    page?: number;
    limit?: number;
    enabled?: boolean;
}

export const useNotificationsQuery = ({
    page = 1,
    limit = 20,
    enabled = true,
}: UseNotificationsQueryOptions = {}) =>
    useQuery({
        queryKey: queryKeys.notifications.list(page, limit),
        queryFn: () => notificationApi.getAll(page, limit),
        enabled, // Restored enabled usage to respect SSR rules
        refetchOnWindowFocus: true, // Keep manual fallback refresh
        refetchOnReconnect: true    // Keep network reconnect refresh
    });
