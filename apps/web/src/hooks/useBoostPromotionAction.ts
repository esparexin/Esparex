"use client";

import { applySpotlightPromotion, applyTopAdPromotion } from "@/lib/api/user/listings";
import { isListingUnavailableError } from "@/lib/listings/listingUnavailable";
import type { PromotionCategory } from "./useBoostPlanDialog.types";

interface UseBoostPromotionActionOptions {
  adId: string | number;
  activeCategory: PromotionCategory;
  onOpenChange: (open: boolean) => void;
  onListingUnavailable?: () => void;
}

export function useBoostPromotionAction({
  adId,
  activeCategory,
  onOpenChange,
  onListingUnavailable,
}: UseBoostPromotionActionOptions) {
  const applyBoost = async (durationDays: number): Promise<boolean> => {
    try {
      if (activeCategory === "SPOTLIGHT") {
        await applySpotlightPromotion(adId, durationDays);
      } else {
        await applyTopAdPromotion(adId, durationDays);
      }
      return true;
    } catch (error) {
      if (isListingUnavailableError(error)) {
        onOpenChange(false);
        onListingUnavailable?.();
        return false;
      }
      throw error;
    }
  };

  return { applyBoost };
}
