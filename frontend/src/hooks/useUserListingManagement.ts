import { useCallback } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import type { User } from "@/types/User";
import logger from "@/lib/logger";
import { queryKeys } from "@/hooks/queries/queryKeys";

export type ListingStatus = "live" | "pending" | "rejected" | "expired" | "sold" | "deactivated";
export type ListingType = "ads" | "spare-parts" | "services";

interface ListingOptions<T> {
    type: ListingType;
    activeTab: string;
    user: User | null;
    statusFilter: ListingStatus;
    fetchApi: () => Promise<T[]>;
    deleteApi: (id: string) => Promise<any>;
    markSoldApi: (id: string, reason?: any) => Promise<any>;
    deactivateApi: (id: string) => Promise<any>;
    repostApi: (id: string) => Promise<any>;
    queryKey: readonly any[];
}

export function useUserListingManagement<T extends { id: string; status: string }>({
    type,
    activeTab,
    user,
    statusFilter,
    fetchApi,
    deleteApi,
    markSoldApi,
    deactivateApi,
    repostApi,
    queryKey
}: ListingOptions<T>) {
    const queryClient = useQueryClient();
    const isEnabled = activeTab === type && !!user;
    const entityLabel = {
        "ads": "Ad",
        "spare-parts": "Spare part listing",
        "services": "Service"
    }[type];

    const {
        data: listings = [],
        isLoading: loading,
        refetch,
        error,
    } = useQuery<T[]>({
        queryKey: [...queryKey, statusFilter],
        queryFn: async () => {
            const all = await fetchApi();
            return all.filter((l) => l.status === statusFilter);
        },
        enabled: isEnabled,
        staleTime: 30_000,
    });

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: queryKeys.ads.stats() });
    }, [queryClient, queryKey]);

    const { mutateAsync: handleDelete } = useMutation({
        mutationFn: deleteApi,
        onSuccess: () => {
            invalidateAll();
            notify.success(`${entityLabel} deleted successfully`);
        },
        onError: (error) => {
            logger.error(`Delete ${type} error:`, error);
            notify.error(`Failed to delete ${entityLabel.toLowerCase()}`);
        },
    });

    const { mutateAsync: handleMarkSold } = useMutation({
        mutationFn: async ({ id, soldReason }: { id: string; soldReason?: string }) => {
            return markSoldApi(id, soldReason);
        },
        onSuccess: () => {
            invalidateAll();
            notify.success(`${entityLabel} marked as sold`);
        },
        onError: (error) => {
            logger.error(`Mark ${type} sold error:`, error);
            notify.error(`Failed to mark ${entityLabel.toLowerCase()} as sold`);
        },
    });

    const { mutateAsync: handleDeactivate } = useMutation({
        mutationFn: deactivateApi,
        onSuccess: () => {
            invalidateAll();
            notify.success(`${entityLabel} deactivated`);
        },
        onError: (error) => {
            logger.error(`Deactivate ${type} error:`, error);
            notify.error(`Failed to deactivate ${entityLabel.toLowerCase()}`);
        },
    });

    const { mutateAsync: handleRepost } = useMutation({
        mutationFn: repostApi,
        onSuccess: () => {
            invalidateAll();
            notify.success(`${entityLabel} reposted — under review`);
        },
        onError: (error) => {
            logger.error(`Repost ${type} error:`, error);
            notify.error(`Failed to repost ${entityLabel.toLowerCase()}`);
        },
    });

    return {
        listings,
        loading,
        error,
        refetch,
        handleDelete: (id: string) => handleDelete(id),
        handleMarkSold: (id: string, soldReason?: string) => handleMarkSold({ id, soldReason }),
        handleDeactivate: (id: string) => handleDeactivate(id),
        handleRepost: (id: string) => handleRepost(id),
    };
}
