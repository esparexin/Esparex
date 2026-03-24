import { useCallback } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { deleteService, markServiceAsSold, deactivateService, repostService } from "@/api/user/services";
import { useMyServicesQuery } from "@/queries/useServicesQuery";
import { queryKeys } from "@/queries/queryKeys";
import type { User } from "@/types/User";
import logger from "@/lib/logger";

export type MyServicesStatus = "live" | "pending" | "rejected" | "expired" | "sold" | "deactivated";

export function useMyServices(
    activeTab: string,
    user: User | null,
    statusFilter: MyServicesStatus = "live"
) {
    const queryClient = useQueryClient();

    const isEnabled = activeTab === "services" && !!user;

    const {
        data: myServices = [],
        isLoading: loadingServices,
        refetch: fetchMyServices,
        error: servicesError,
    } = useMyServicesQuery(statusFilter, { enabled: isEnabled });

    if (servicesError) {
        logger.error("MyServices query failed:", servicesError);
    }

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    }, [queryClient]);

    const { mutateAsync: handleDeleteService } = useMutation({
        mutationFn: async (id: string) => {
            const success = await deleteService(id);
            if (!success) {
                throw new Error("Delete operation failed");
            }
            return id;
        },
        onSuccess: () => {
            invalidateAll();
            notify.success("Service deleted successfully");
        },
        onError: (error) => {
            logger.error("Delete service error:", error);
            notify.error("An error occurred while deleting the service");
        },
    });

    const { mutateAsync: handleMarkSoldService } = useMutation({
        mutationFn: async ({ id, soldReason }: { id: string; soldReason?: "sold_on_platform" | "sold_outside" | "no_longer_available" }) => {
            const success = await markServiceAsSold(id, soldReason);
            if (!success) throw new Error("Failed to mark service as sold");
            return id;
        },
        onSuccess: () => {
            invalidateAll();
            notify.success("Service marked as sold");
        },
        onError: (error) => {
            logger.error("Mark service sold error:", error);
            notify.error("Failed to mark service as sold");
        },
    });

    const { mutateAsync: handleDeactivateService } = useMutation({
        mutationFn: async (id: string) => {
            const success = await deactivateService(id);
            if (!success) throw new Error("Failed to deactivate service");
            return id;
        },
        onSuccess: () => {
            invalidateAll();
            notify.success("Service deactivated");
        },
        onError: (error) => {
            logger.error("Deactivate service error:", error);
            notify.error("Failed to deactivate service");
        },
    });

    const { mutateAsync: handleRepostService } = useMutation({
        mutationFn: async (id: string) => {
            const success = await repostService(id);
            if (!success) throw new Error("Failed to repost service");
            return id;
        },
        onSuccess: () => {
            invalidateAll();
            notify.success("Service reposted — under review");
        },
        onError: (error) => {
            logger.error("Repost service error:", error);
            notify.error("Failed to repost service");
        },
    });

    return {
        myServices,
        loadingServices,
        servicesError,
        fetchMyServices,
        handleDeleteService: (id: string) => handleDeleteService(id),
        handleMarkSoldService: (id: string, soldReason?: "sold_on_platform" | "sold_outside" | "no_longer_available") =>
            handleMarkSoldService({ id, soldReason }),
        handleDeactivateService: (id: string) => handleDeactivateService(id),
        handleRepostService: (id: string) => handleRepostService(id),
    };
}
