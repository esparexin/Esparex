import { useCallback } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { notify } from "@/lib/feedback";
import type { User } from "@esparex/contracts";
import logger from "@/lib/logger";
import { queryKeys } from "@/hooks/queries/queryKeys";

import { type ListingStatus } from "@esparex/contracts";

export type { ListingStatus };
export type ListingType = "ads" | "spare-parts" | "services";
export type ListingSoldReason = "sold_on_platform" | "sold_outside" | "no_longer_available";

export interface UserListingPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
}

interface ListingQueryResult<T> {
    items: T[];
    pagination: UserListingPagination;
}

interface ListingOptions<T> {
    type: ListingType;
    activeTab: string;
    user: User | null;
    statusFilter: ListingStatus;
    page?: number;
    limit?: number;
    fetchApi: () => Promise<T[] | { data: T[]; pagination?: { total?: number; page?: number; limit?: number; hasMore?: boolean; totalPages?: number } }>;
    deleteApi: (id: string) => Promise<unknown>;
    markSoldApi: (id: string, reason?: ListingSoldReason) => Promise<unknown>;
    deactivateApi: (id: string) => Promise<unknown>;
    activateApi?: (id: string) => Promise<unknown>;
    repostApi: (id: string) => Promise<unknown>;
    queryKey: readonly unknown[];
}

export function useUserListingManagement<T extends { id: string; status: string }>({
    type,
    activeTab,
    user,
    statusFilter,
    page = 1,
    limit = 10,
    fetchApi,
    deleteApi,
    markSoldApi,
    deactivateApi,
    activateApi,
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
        data: queryResult,
        isLoading: loading,
        refetch,
        error,
    } = useQuery<ListingQueryResult<T>>({
        queryKey: [...queryKey, statusFilter, page, limit],
        queryFn: async () => {
            const res = await fetchApi();
            const rawItems: T[] = Array.isArray(res) ? res : (res?.data || []);
            const paginationRaw = Array.isArray(res) ? null : res?.pagination;

            const nowMs = Date.now();
            const filtered = rawItems.filter((l) => {
                const expiresAtVal = (l as Record<string, unknown>).expiresAt;
                const expiresAtMs = expiresAtVal ? new Date(String(expiresAtVal)).getTime() : null;
                const isPastExpiry = Boolean(expiresAtMs && expiresAtMs <= nowMs);

                if (statusFilter === "live") {
                    if (isPastExpiry) return false;
                    return ["active", "live", "deactivated"].includes(l.status);
                }
                if (statusFilter === "expired") {
                    return ["expired", "sold"].includes(l.status) || isPastExpiry;
                }
                return l.status === statusFilter;
            });

            const effectiveLimit = limit || paginationRaw?.limit || 10;
            const effectivePage = page || paginationRaw?.page || 1;
            const effectiveTotal =
                typeof paginationRaw?.total === "number" && paginationRaw.total > 0
                    ? paginationRaw.total
                    : (paginationRaw?.total === 0 && filtered.length === 0
                        ? 0
                        : filtered.length);
            const totalPages =
                paginationRaw?.totalPages && paginationRaw.totalPages > 0
                    ? paginationRaw.totalPages
                    : (Math.ceil(effectiveTotal / effectiveLimit) || 1);

            return {
                items: filtered,
                pagination: {
                    total: effectiveTotal,
                    page: effectivePage,
                    limit: effectiveLimit,
                    totalPages,
                    hasMore: Boolean(paginationRaw?.hasMore ?? effectivePage < totalPages),
                }
            };
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
        mutationFn: async ({ id, soldReason }: { id: string; soldReason?: ListingSoldReason }) => {
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

    const { mutateAsync: handleActivate } = useMutation({
        mutationFn: (id: string) => activateApi ? activateApi(id) : Promise.reject(new Error('Activate not supported')),
        onSuccess: () => {
            invalidateAll();
            notify.success(`${entityLabel} reactivated — under review`);
        },
        onError: (error) => {
            logger.error(`Activate ${type} error:`, error);
            notify.error(`Failed to reactivate ${entityLabel.toLowerCase()}`);
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
        listings: queryResult?.items ?? [],
        pagination: queryResult?.pagination,
        loading,
        error,
        refetch,
        handleDelete: (id: string) => handleDelete(id),
        handleMarkSold: (id: string, soldReason?: ListingSoldReason) => handleMarkSold({ id, soldReason }),
        handleDeactivate: (id: string) => handleDeactivate(id),
        handleActivate: (id: string) => handleActivate(id),
        handleRepost: (id: string) => handleRepost(id),
    };
}
