"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useSavedAdsQuery } from "@/hooks/queries/useListingsQuery";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { saveAd, unsaveAd, type SavedAd } from "@/lib/api/user/users";
import { normalizeListing as normalizeAd } from "@/lib/api/user/listings";
import { notify } from "@/lib/feedback";
import { haptics } from "@/lib/haptics";

export interface UseFavoriteAdReturn {
  isSaved: boolean;
  toggleSave: (adId: string | number, e?: React.MouseEvent) => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook to manage listing favorite/saved state with auth gating and optimistic updates.
 */
export function useFavoriteAd(
  adId: string | number,
  explicitIsSaved?: boolean
): UseFavoriteAdReturn {
  const queryClient = useQueryClient();
  const { user, status } = useAuth();
  const { showLogin } = useAuthModal();
  const isAuthenticated = status === "authenticated" && Boolean(user);

  const { data: savedAds = [], isLoading } = useSavedAdsQuery({
    enabled: isAuthenticated && explicitIsSaved === undefined,
  });

  const isSaved = useMemo(() => {
    if (explicitIsSaved !== undefined) return explicitIsSaved;
    if (!isAuthenticated) return false;
    const targetIdStr = String(adId);
    return savedAds.some((saved) => String(saved.id) === targetIdStr);
  }, [explicitIsSaved, isAuthenticated, savedAds, adId]);

  const toggleSave = useCallback(
    async (_id: string | number, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      haptics.toggle();

      if (!isAuthenticated) {
        showLogin();
        return;
      }

      const targetIdStr = String(adId);
      const wasSaved = isSaved;

      // Optimistic cache update
      queryClient.setQueryData<SavedAd[]>(queryKeys.ads.saved(), (prev = []) => {
        if (wasSaved) {
          return prev.filter((item) => String(item.id) !== targetIdStr);
        }
        return [normalizeAd({ id: targetIdStr, title: "" }), ...prev];
      });

      try {
        if (wasSaved) {
          await unsaveAd(adId);
          notify.success("Removed from favorites");
        } else {
          await saveAd(adId);
          notify.success("Saved to favorites");
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.ads.saved() });
      } catch {
        void queryClient.invalidateQueries({ queryKey: queryKeys.ads.saved() });
        notify.error("Failed to update favorite status");
      }
    },
    [adId, isSaved, isAuthenticated, showLogin, queryClient]
  );

  return {
    isSaved,
    toggleSave,
    isLoading,
  };
}
