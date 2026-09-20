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
    activateListing,
    repostListing,
    type Listing,
} from "@/lib/api/user/listings";
import { LISTING_TYPE } from "@esparex/contracts";
import { queryKeys } from "@/hooks/queries/queryKeys";
import type { User } from "@esparex/contracts";

export type ProfileListingType = "ads" | "services" | "spare-parts";

export interface UseProfileListingsOptions {
    type: ProfileListingType;
    activeSubTab: string;
    user: User | null;
    statusFilter?: ListingStatus;
    page?: number;
    limit?: number;
}

type ListingManagerConfig = {
    fetchApi: () => Promise<{ data: Listing[]; pagination?: { total?: number; page?: number; limit?: number; hasMore?: boolean; totalPages?: number } }>;
    deleteApi: (id: string) => Promise<unknown>;
    markSoldApi: (id: string, reason?: ListingSoldReason) => Promise<unknown>;
    deactivateApi: (id: string) => Promise<unknown>;
    activateApi?: (id: string) => Promise<unknown>;
    repostApi: (id: string) => Promise<unknown>;
    queryKey: readonly unknown[];
};

export function useProfileListings({
    type,
    activeSubTab,
    user,
    statusFilter = "live",
    page = 1,
    limit = 10,
}: UseProfileListingsOptions) {
    const isActive = activeSubTab === type;

    const configMap: Record<ProfileListingType, ListingManagerConfig> = {
        ads: {
            fetchApi: () => getMyListings(LISTING_TYPE.AD, statusFilter, page, limit),
            deleteApi: (id: string) => deleteListing(id, LISTING_TYPE.AD),
            markSoldApi: (id: string, reason?: ListingSoldReason) => markListingAsSold(id, reason, statusFilter === 'expired'),
            deactivateApi: (id: string) => deactivateListing(id),
            activateApi: (id: string) => activateListing(id),
            repostApi: (id: string) => repostListing(id, LISTING_TYPE.AD),
            queryKey: queryKeys.ads.myAds(statusFilter, LISTING_TYPE.AD)
        },
        services: {
            fetchApi: () => getMyListings(LISTING_TYPE.SERVICE, statusFilter, page, limit),
            deleteApi: (id: string) => deleteListing(id, LISTING_TYPE.SERVICE),
            markSoldApi: (id: string, reason?: ListingSoldReason) => markListingAsSold(id, reason, statusFilter === 'expired'),
            deactivateApi: deactivateListing,
            activateApi: (id: string) => activateListing(id),
            repostApi: (id: string) => repostListing(id, LISTING_TYPE.SERVICE),
            queryKey: queryKeys.ads.myAds(statusFilter, LISTING_TYPE.SERVICE)
        },
        "spare-parts": {
            fetchApi: () => getMyListings(LISTING_TYPE.SPARE_PART, statusFilter, page, limit),
            deleteApi: (id: string) => deleteListing(id, LISTING_TYPE.SPARE_PART),
            markSoldApi: (id: string, reason?: ListingSoldReason) => markListingAsSold(id, reason, statusFilter === 'expired'),
            deactivateApi: deactivateListing,
            activateApi: (id: string) => activateListing(id),
            repostApi: (id: string) => repostListing(id, LISTING_TYPE.SPARE_PART),
            queryKey: queryKeys.ads.myAds(statusFilter, LISTING_TYPE.SPARE_PART)
        }
    };
    const config = configMap[type];

    const {
        listings,
        pagination,
        loading,
        error,
        refetch,
        handleDelete,
        handleMarkSold,
        handleDeactivate,
        handleActivate,
        handleRepost,
    } = useUserListingManagement<Listing>({
        type,
        activeTab: isActive ? type : "",
        user,
        statusFilter,
        page,
        limit,
        ...config
    });

    return {
        listings,
        pagination,
        loading,
        error,
        refetch,
        handleDelete,
        handleMarkSold,
        handleDeactivate,
        handleActivate,
        handleRepost,
    };
}
