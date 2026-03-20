import { useQuery } from "@tanstack/react-query";

import { getMyServices, getServiceById, type Service } from "@/api/user/services";
import { queryKeys } from "./queryKeys";

export const useServiceDetailQuery = (
  id: string | number,
  options?: { enabled?: boolean; initialData?: Service | null }
) => {
  return useQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => getServiceById(String(id)),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 10 * 60 * 1000,
    initialData: options?.initialData ?? undefined,
  });
};

/**
 * Hook to fetch services created by the current user
 */
export const useMyServicesQuery = (status?: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.services.myServices(status),
    queryFn: async () => {
      const all = await getMyServices();
      return status ? all.filter((s) => s.status === status) : all;
    },
    staleTime: 0,
    ...options,
  });
};
