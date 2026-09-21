"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSmartAlertMatches, type FetchSmartAlertMatchesParams } from "@/lib/api/user/smartAlerts";
import { queryKeys } from "@/hooks/queries/queryKeys";

export interface UseSmartAlertMatchesOptions extends FetchSmartAlertMatchesParams {
  enabled?: boolean;
}

export const useSmartAlertMatches = ({
  page = 1,
  limit = 4,
  alertId,
  enabled = true,
}: UseSmartAlertMatchesOptions = {}) => {
  return useQuery({
    queryKey: queryKeys.alerts.matches({ page, limit, alertId }),
    queryFn: () => fetchSmartAlertMatches({ page, limit, alertId }),
    enabled,
    staleTime: 60 * 1000, // 1 min
    refetchOnWindowFocus: true,
  });
};
