import { useCallback } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { getMySparePartListings } from "@/api/user/sparePartListings";
import type { SparePartListing } from "@/api/user/sparePartListings";
import { markAsSold } from "@/api/user/ads";
import { queryKeys } from "@/queries/queryKeys";
import type { User } from "@/types/User";
import logger from "@/lib/logger";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/api/routes";

export type MySparePartsStatus = "live" | "pending" | "rejected" | "expired" | "sold" | "deactivated";

export function useMySpare(
    activeTab: string,
    user: User | null,
    statusFilter: MySparePartsStatus = "live"
) {
    const queryClient = useQueryClient();
    const isEnabled = activeTab === "spare-parts" && !!user;

    const {
        data: mySpare = [],
        isLoading: loadingSpare,
        refetch: fetchMySpare,
        error: spareError,
    } = useQuery<SparePartListing[]>({
        queryKey: [...queryKeys.spare.all, statusFilter],
        queryFn: async () => {
            const listings = await getMySparePartListings();
            return listings.filter((l) => l.status === statusFilter);
        },
        enabled: isEnabled,
        staleTime: 30_000,
    });

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.spare.all });
    }, [queryClient]);

    const { mutateAsync: handleDeleteSpare } = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(API_ROUTES.USER.SPARE_PART_LISTING_DETAIL(id));
            return id;
        },
        onSuccess: () => {
            invalidateAll();
            notify.success("Spare part listing deleted.");
        },
        onError: (error) => {
            logger.error("Delete spare part error:", error);
            notify.error("Failed to delete spare part listing.");
        },
    });

    const { mutateAsync: markSoldSpare } = useMutation({
        mutationFn: async ({ id, soldReason }: { id: string; soldReason?: "sold_on_platform" | "sold_outside" | "no_longer_available" }) => {
            const result = await markAsSold(id, soldReason);
            if (!result) throw new Error("Failed to mark as sold");
            return id;
        },
        onSuccess: () => {
            invalidateAll();
            notify.success("Spare part marked as sold.");
        },
        onError: (error) => {
            logger.error("Mark spare part sold error:", error);
            notify.error("Failed to mark spare part as sold.");
        },
    });

    return {
        mySpare,
        loadingSpare,
        spareError,
        fetchMySpare,
        handleDeleteSpare: (id: string) => handleDeleteSpare(id),
        handleMarkSoldSpare: (id: string, soldReason?: "sold_on_platform" | "sold_outside" | "no_longer_available") =>
            markSoldSpare({ id, soldReason }),
    };
}
