"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  InContentPlacementId,
  ResolveAdResponse,
} from "@esparex/contracts";
import { useAuth } from "@/context/AuthContext";

export function useAdPlacement(placementId: InContentPlacementId, category?: string) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<ResolveAdResponse>({
    queryKey: ["ad-placement", placementId, category, Boolean(user)],
    queryFn: async () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const isTablet = typeof window !== "undefined" && window.innerWidth >= 768 && window.innerWidth < 1024;
      const device = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

      const res = await fetch("/api/v1/monetization/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placementId,
          device,
          category,
          isAuthenticated: Boolean(user),
          isBusiness: Boolean(user?.businessId),
        }),
      });

      if (!res.ok) {
        return { ad: null, fallbackAd: null, renderedProvider: "none" };
      }

      const json = await res.json();
      return json.data || { ad: null, fallbackAd: null, renderedProvider: "none" };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const recordImpression = (campaignId: string) => {
    fetch(`/api/v1/monetization/${campaignId}/impression`, { method: "POST" }).catch(() => {});
  };

  const recordClick = (campaignId: string) => {
    fetch(`/api/v1/monetization/${campaignId}/click`, { method: "POST" }).catch(() => {});
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
