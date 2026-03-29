import { useNotificationsQuery } from "@/hooks/queries";
import { useNotificationSync } from "@/hooks/useNotificationSync";
import { useLocationSelector } from "@/hooks/useLocationSelector";
import { useHeaderSearch } from "@/hooks/useHeaderSearch";
import { getHeaderLocationText } from "@/lib/location/locationService";

interface UseSharedHeaderLogicOptions {
    isLoggedIn: boolean;
    onSearch?: (query: string) => void;
    disableNotificationsFetch?: boolean;
}

export function useSharedHeaderLogic({
    isLoggedIn,
    onSearch,
    disableNotificationsFetch = false
}: UseSharedHeaderLogicOptions) {
    // 1. Notifications logic
    const shouldFetchNotifications = isLoggedIn && !disableNotificationsFetch;
    const {
        data: notificationsData,
        refetch: refetchNotifications,
    } = useNotificationsQuery({
        page: 1,
        limit: 10,
        enabled: shouldFetchNotifications,
    });
    const notifUnreadCount = typeof notificationsData?.unreadCount === 'number' ? notificationsData.unreadCount : 0;

    useNotificationSync({ enabled: shouldFetchNotifications });

    // 2. Location Logic
    const locationProps = useLocationSelector({ mode: "header" });
    const { globalLocation: location } = locationProps;
    const resolvedHeaderLocation = getHeaderLocationText(location).headerText || "Select Location";

    // 3. Search Logic
    const searchProps = useHeaderSearch({
        onSearch,
    });

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        searchProps.handleSearch();
    };

    return {
        ...locationProps,
        ...searchProps,
        resolvedHeaderLocation,
        notificationsData,
        notifUnreadCount,
        refetchNotifications,
        handleSearchSubmit
    };
}
