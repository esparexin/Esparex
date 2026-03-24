import { useCallback } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { deleteAd, markAsSold } from "@/api/user/ads";
import { useMyAdsQuery, useMyAdsStatsQuery } from "@/queries/useAdsQuery";
import { queryKeys } from "@/queries/queryKeys";
import type { User } from "@/types/User";
// Local type definition for MyAdsStatus
type MyAdsStatus = "live" | "pending" | "sold" | "deleted" | "rejected" | "suspended" | "expired" | "deactivated";
import logger from "@/lib/logger";

export function useMyAds(activeTab: string, user: User | null, statusFilter: MyAdsStatus = "live") {
    const queryClient = useQueryClient();

    // "listings" is the unified tab, "myads" is the legacy standalone tab
    const isEnabled = (activeTab === "myads" || activeTab === "listings") && !!user;

    // Fetch Ads using TanStack Query
    const {
        data: myAds = [],
        isLoading: loadingAds,
        refetch: fetchMyAds,
        error: adsError
    } = useMyAdsQuery(statusFilter, { enabled: isEnabled });

    if (adsError) {
        logger.error("MyAds query failed:", adsError);
    }

    // Fetch Stats using TanStack Query
    const {
        data: adCounts = { active: 0, pending: 0, sold: 0, expired: 0, rejected: 0, deactivated: 0 }
    } = useMyAdsStatsQuery({ enabled: isEnabled });

    // Invalidation helper to refresh ads and stats
    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.ads.all });
    }, [queryClient]);

    // Delete Mutation
    const { mutateAsync: handleDeleteAd } = useMutation({
        mutationFn: async (id: string | number) => {
            const success = await deleteAd(id);
            if (!success) {
                throw new Error("Delete operation failed");
            }
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myAds"] });
            invalidateAll();
            notify.success("Ad deleted successfully");
        },
        onError: (error) => {
            logger.error("Delete ad error:", error);
            notify.error("An error occurred while deleting the ad");
        }
    });

    // Mark as Sold Mutation
    const { mutateAsync: handleMarkAsSold } = useMutation({
        mutationFn: async ({ id, soldReason }: { id: string | number, soldReason?: "sold_on_platform" | "sold_outside" | "no_longer_available" }) => {
            const success = await markAsSold(id, soldReason);
            if (!success) {
                throw new Error("Mark as sold operation failed");
            }
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myAds"] });
            invalidateAll();
            notify.success("Ad marked as sold");
        },
        onError: (error) => {
            logger.error("Mark as sold error:", error);
            notify.error("An error occurred while marking the ad as sold");
        }
    });

    return {
        myAds,
        loadingAds,
        fetchMyAds,
        adCounts,
        handleDeleteAd,
        handleMarkAsSold
    };
}