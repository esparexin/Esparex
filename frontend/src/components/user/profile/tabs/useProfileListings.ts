import { useUserListingManagement, ListingStatus } from "@/hooks/useUserListingManagement";
import { 
    getMyListings, 
    deleteListing, 
    markListingAsSold, 
    deactivateListing, 
    repostListing 
} from "@/lib/api/user/listings";
import { LISTING_TYPE } from "@shared/enums/listingType";
import { queryKeys } from "@/hooks/queries/queryKeys";
import type { User } from "@/types/User";

export type ProfileListingType = "ads" | "services" | "spare-parts";

export function useProfileListings<T extends { id: any; status: string } = any>(
    type: ProfileListingType,
    activeSubTab: string,
    user: User | null,
    statusFilter: ListingStatus = "live"
) {
    const isActive = activeSubTab === type;

    const config: any = {
        ads: {
            fetchApi: () => getMyListings(LISTING_TYPE.AD, statusFilter).then(res => res.data),
            deleteApi: (id: string) => deleteListing(id, LISTING_TYPE.AD),
            markSoldApi: markListingAsSold,
            deactivateApi: deactivateListing,
            repostApi: (id: string) => repostListing(id, LISTING_TYPE.AD),
            queryKey: queryKeys.ads.myAds(statusFilter, LISTING_TYPE.AD)
        },
        services: {
            fetchApi: () => getMyListings(LISTING_TYPE.SERVICE, statusFilter).then(res => res.data),
            deleteApi: (id: string) => deleteListing(id, LISTING_TYPE.SERVICE),
            markSoldApi: markListingAsSold,
            deactivateApi: deactivateListing,
            repostApi: (id: string) => repostListing(id, LISTING_TYPE.SERVICE),
            queryKey: queryKeys.ads.myAds(statusFilter, LISTING_TYPE.SERVICE)
        },
        "spare-parts": {
            fetchApi: () => getMyListings(LISTING_TYPE.SPARE_PART, statusFilter).then(res => res.data),
            deleteApi: (id: string) => deleteListing(id, LISTING_TYPE.SPARE_PART),
            markSoldApi: markListingAsSold,
            deactivateApi: deactivateListing,
            repostApi: (id: string) => repostListing(id, LISTING_TYPE.SPARE_PART),
            queryKey: queryKeys.ads.myAds(statusFilter, LISTING_TYPE.SPARE_PART)
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
