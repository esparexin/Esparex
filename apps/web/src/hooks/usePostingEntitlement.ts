"use client";

import { useEffect, useState, useCallback } from "react";
import type { PostingEntitlementMatrixDTO, SingleEntitlementState } from "@esparex/contracts";
import { apiClient } from "@/lib/api/client";
import { unwrapApiPayload } from "@/lib/api/result";

type ModuleType = "ads" | "services" | "spareParts" | "smartAlerts";

export function usePostingEntitlement(moduleType?: ModuleType) {
  const [matrix, setMatrix] = useState<PostingEntitlementMatrixDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<unknown>("entitlements/posting");
      const unwrapped = unwrapApiPayload<PostingEntitlementMatrixDTO>(res);
      if (unwrapped) {
        setMatrix(unwrapped);
      } else {
        setError("Failed to load posting entitlements");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching entitlements";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEntitlements();
  }, [fetchEntitlements]);

  const activeEntitlement: SingleEntitlementState | null =
    matrix && moduleType ? matrix[moduleType] : null;

  return {
    matrix,
    entitlement: activeEntitlement,
    isAllowed: activeEntitlement ? activeEntitlement.allowed : true,
    isLoading,
    error,
    refetch: fetchEntitlements,
  };
}
