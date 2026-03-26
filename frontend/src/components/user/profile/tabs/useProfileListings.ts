import { useUserListingManagement, ListingStatus } from "@/hooks/useUserListingManagement";
import { deleteService, markServiceAsSold, deactivateService, repostService } from "@/lib/api/user/services";
import { getMySparePartListings, deactivateSparePartListing, repostSparePartListing } from "@/lib/api/user/sparePartListings";
import { markAsSold } from "@/lib/api/user/ads";
import { useMyServicesQuery } from "@/hooks/queries/useServicesQuery";
import { queryKeys } from "@/hooks/queries/queryKeys";
import type { User } from "@/types/User";

export type ProfileListingType = "services" | "spare-parts";

export function useProfileListings<T extends { id: any; status: string } = any>(
    type: ProfileListingType,
    activeSubTab: string,
    user: User | null,
    statusFilter: ListingStatus = "live"
) {
    const isActive = activeSubTab === type;

    const config: any = {
        services: {
            fetchApi: () => useMyServicesQuery(statusFilter, { enabled: isActive }).refetch().then(r => r.data || []),
            deleteApi: deleteService,
            markSoldApi: markServiceAsSold,
            deactivateApi: deactivateService,
            repostApi: repostService,
            queryKey: queryKeys.services.all
        },
        "spare-parts": {
            fetchApi: getMySparePartListings,
            deleteApi: (id: string) => Promise.resolve(id),
            markSoldApi: markAsSold,
            deactivateApi: deactivateSparePartListing,
            repostApi: repostSparePartListing,
            queryKey: queryKeys.spare.all
        }
    }[type];

    const {
        listings,
        loading,
        error,
        refetch,
        handleDelete,
        handleMarkSold,
        handleDeactivate,
        handleRepost,
    } = useUserListingManagement<T>({
        type: type as any,
        activeTab: isActive ? type : "",
        user,
        statusFilter,
        ...config
    });

    return {
        listings,
        loading,
        error,
        refetch,
        handleDelete,
        handleMarkSold,
        handleDeactivate,
        handleRepost,
    };
}
