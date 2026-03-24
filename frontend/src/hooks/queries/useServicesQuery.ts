import { useQuery } from "@tanstack/react-query";

import { getMyServices } from "@/lib/api/user/services";
import { queryKeys } from "./queryKeys";



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
