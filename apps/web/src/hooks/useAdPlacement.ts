"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  InContentPlacementId,
  ResolveAdResponse,
} from "@esparex/contracts";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api/client";
import { toApiResult } from "@/lib/api/result";

export function useAdPlacement(placementId: InContentPlacementId, category?: string) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<ResolveAdResponse>({
    queryKey: ["ad-placement", placementId, category, Boolean(user)],
    queryFn: async () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const isTablet = typeof window !== "undefined" && window.innerWidth >= 768 && window.innerWidth < 1024;
      const device = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

      const { data: resData } = await toApiResult<ResolveAdResponse>(
        apiClient.post("/monetization/resolve", {
          placementId,
          device,
          category,
          isAuthenticated: Boolean(user),
          isBusiness: Boolean(user?.businessId),
        }, { silent: true })
      );

      return resData || { ad: null, fallbackAd: null, renderedProvider: "none" };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const recordImpression = (campaignId: string) => {
    apiClient.post(`/monetization/${campaignId}/impression`, {}, { silent: true }).catch(() => {});
  };

  const recordClick = (campaignId: string) => {
    apiClient.post(`/monetization/${campaignId}/click`, {}, { silent: true }).catch(() => {});
  };

  return {
    ad: data?.ad || null,
    fallbackAd: data?.fallbackAd || null,
    renderedProvider: data?.renderedProvider || "none",
    isLoading,
    recordImpression,
    recordClick,
  };
}
