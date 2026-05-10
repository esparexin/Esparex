import {
    useUserListingManagement,
    type ListingStatus,
    type ListingSoldReason,
} from "@/hooks/useUserListingManagement";
import { 
    getMyListings, 
    deleteListing, 
    markListingAsSold, 
    deactivateListing,
    repostListing,
    type Listing,
} from "@/lib/api/user/listings";
import { LISTING_TYPE } from "@shared/enums/listingType";
import { queryKeys } from "@/hooks/queries/queryKeys";
import type { User } from "@/types/User";

export type ProfileListingType = "ads" | "services" | "spare-parts";

type ListingManagerConfig = {
    fetchApi: () => Promise<Listing[]>;
    deleteApi: (id: string) => Promise<unknown>;
    markSoldApi: (id: string, reason?: ListingSoldReason) => Promise<unknown>;
    deactivateApi: (id: string) => Promise<unknown>;
    repostApi: (id: string) => Promise<unknown>;
    queryKey: readonly unknown[];
};

export function useProfileListings(
    type: ProfileListingType,
    activeSubTab: string,
    user: User | null,
    statusFilter: ListingStatus = "live"
) {
    const isActive = activeSubTab === type;

    const configMap: Record<ProfileListingType, ListingManagerConfig> = {
        ads: {
            fetchApi: async () => (await getMyListings(LISTING_TYPE.AD, statusFilter)).data,
            deleteApi: (id: string) => deleteListing(id, LISTING_TYPE.AD),
            markSoldApi: (id: string, reason?: ListingSoldReason) => markListingAsSold(id, reason, statusFilter === 'expired'),
            deactivateApi: (id: string) => deactivateListing(id),
            repostApi: (id: string) => repostListing(id, LISTING_TYPE.AD),
            queryKey: queryKeys.ads.myAds(statusFilter, LISTING_TYPE.AD)
        },
        services: {
            fetchApi: async () => (await getMyListings(LISTING_TYPE.SERVICE, statusFilter)).data,
            deleteApi: (id: string) => deleteListing(id, LISTING_TYPE.SERVICE),
            markSoldApi: (id: string, reason?: ListingSoldReason) => markListingAsSold(id, reason, statusFilter === 'expired'),
            deactivateApi: deactivateListing,
            repostApi: (id: string) => repostListing(id, LISTING_TYPE.SERVICE),
            queryKey: queryKeys.ads.myAds(statusFilter, LISTING_TYPE.SERVICE)
        },
        "spare-parts": {
            fetchApi: async () => (await getMyListings(LISTING_TYPE.SPARE_PART, statusFilter)).data,
            deleteApi: (id: string) => deleteListing(id, LISTING_TYPE.SPARE_PART),
            markSoldApi: (id: string, reason?: ListingSoldReason) => markListingAsSold(id, reason, statusFilter === 'expired'),
            deactivateApi: deactivateListing,
            repostApi: (id: string) => repostListing(id, LISTING_TYPE.SPARE_PART),
            queryKey: queryKeys.ads.myAds(statusFilter, LISTING_TYPE.SPARE_PART)
        }
    };
    const config = configMap[type];

    const {
        listings,
        loading,
        error,
        refetch,
        handleDelete,
        handleMarkSold,
        handleDeactivate,
        handleRepost,
    } = useUserListingManagement<Listing>({
        type,
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
