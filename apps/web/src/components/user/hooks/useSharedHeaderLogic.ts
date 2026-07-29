import { useState, useRef, useCallback } from "react";
import { useNotificationsQuery } from "@/hooks/queries";
import { useNotificationSync } from "@/hooks/useNotificationSync";
import { useLocationData } from "@/context/LocationContext";
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

    // 2. Location Logic (directly consuming LocationContext SSOT)
    const { location } = useLocationData();
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const locationDropdownRef = useRef<HTMLDivElement>(null);
    const toggleLocationSelector = useCallback(() => setShowLocationSelector((prev) => !prev), []);

    const headerLocationDetails = getHeaderLocationText(location);
    const resolvedHeaderLocation = headerLocationDetails.headerText || "Select Location";

    // 3. Search Logic
    const searchProps = useHeaderSearch({
        onSearch,
    });

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        searchProps.handleSearch();
    };

    return {
        showLocationSelector,
        setShowLocationSelector,
        locationDropdownRef,
        toggleLocationSelector,
        globalLocation: location,
        location,
        ...searchProps,
        headerLocationDetails,
        resolvedHeaderLocation,
        notificationsData,
        notifUnreadCount,
        refetchNotifications,
        handleSearchSubmit
    };
}
