import { useCallback } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { deleteService } from "@/api/user/services";
import { useMyServicesQuery } from "@/queries/useServicesQuery";
import { queryKeys } from "@/queries/queryKeys";
import type { User } from "@/types/User";
import logger from "@/lib/logger";

export type MyServicesStatus = "live" | "pending" | "rejected" | "expired" | "deactivated";

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
        console.error("MyServices query failed:", servicesError);
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

    return {
        myServices,
        loadingServices,
        servicesError,
        fetchMyServices,
        handleDeleteService: (id: string) => handleDeleteService(id),
    };
}