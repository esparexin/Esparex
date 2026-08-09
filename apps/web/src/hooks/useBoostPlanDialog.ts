"use client";

import { useState, useEffect } from "react";
import { getPlans, type Plan as ApiPlan } from "@/lib/api/user/plans";
import { applySpotlightPromotion, applyTopAdPromotion } from "@/lib/api/user/listings";
import { notify } from "@/lib/feedback";
import { mapErrorToMessage } from "@/lib/errorMapper";
import logger from "@/lib/logger";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { isListingUnavailableError } from "@/lib/listings/listingUnavailable";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { usePlansWalletDashboard } from "@/hooks/usePlansWalletDashboard";


export type PromotionCategory = "SPOTLIGHT" | "BOOST_AD";

export type BoostPlan = ApiPlan & {
  durationDays: number;
  displayBoost: string;
};

function getCreditRemaining(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (
    raw &&
    typeof raw === "object" &&
    "remaining" in raw &&
    typeof (raw as { remaining: number }).remaining === "number"
  ) {
    return (raw as { remaining: number }).remaining;
  }
  return 0;
}

export function formatPlanName(
  name?: string,
  category: PromotionCategory = "SPOTLIGHT"
): string {
  if (!name || name.toLowerCase().includes("new user plan")) {
    return category === "SPOTLIGHT"
      ? "Spotlight Featured Boost"
      : "Top Ad Priority Placement";
  }
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface UseBoostPlanDialogOptions {
  open: boolean;
  adId: string | number;
  adTitle: string;
  onOpenChange: (open: boolean) => void;
  onPlanPurchased?: (planType: string, duration: number) => void;
  onListingUnavailable?: () => void;
}

export interface UseBoostPlanDialogReturn {
  activeCategory: PromotionCategory;
  setActiveCategory: (cat: PromotionCategory) => void;
  boostPlans: BoostPlan[];
  selectedPlanId: string;
  setSelectedPlanId: (id: string) => void;
  selectedPlan: BoostPlan | null;
  setSelectedPlan: (plan: BoostPlan | null) => void;
  isLoadingPlans: boolean;
  isProcessing: boolean;
  isWalletCreditSelected: boolean;
  availableCredits: number;
  spotlightCredits: number;
  topAdCredits: number;
  displayAdTitle: string;
  handleUseCredits: () => Promise<void>;
  handlePurchase: () => Promise<void>;
}

export function useBoostPlanDialog({
  open,
  adId,
  adTitle,
  onOpenChange,
  onPlanPurchased,
  onListingUnavailable,
}: UseBoostPlanDialogOptions): UseBoostPlanDialogReturn {
  const [activeCategory, setActiveCategory] =
    useState<PromotionCategory>("SPOTLIGHT");
  const [boostPlans, setBoostPlans] = useState<BoostPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("WALLET_CREDIT");
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const { isProcessing, setIsProcessing, startPlanCheckout } = usePlanCheckout();
  const { benefits } = useUserBenefits();
  const { dashboardData } = usePlansWalletDashboard();

  const spotlightCredits = Math.max(
    getCreditRemaining(benefits?.balances?.spotlightCredits),
    dashboardData?.wallet?.spotlightCredits ?? 0
  );
  const topAdCredits = Math.max(
    getCreditRemaining(benefits?.balances?.topAdCredits),
    dashboardData?.wallet?.topAdCredits ?? 0
  );
  const availableCredits =
    activeCategory === "SPOTLIGHT" ? spotlightCredits : topAdCredits;

  const displayAdTitle =
    String(adTitle || "")
      .split(" with ")[0]
      ?.trim() || "";

  useEffect(() => {
    const fetchBoostPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const plans = await getPlans({ type: activeCategory, userType: "normal" });
        const normalized: BoostPlan[] = plans
          .filter(
            (plan) =>
              plan.type === activeCategory && !plan.isDefault && plan.price > 0
          )
          .map((plan) => ({
            ...plan,
            durationDays: plan.durationDays || 7,
            displayBoost: `${plan.features?.priorityWeight || 2}x`,
          }));
        setBoostPlans(normalized);

        if (availableCredits > 0) {
          setSelectedPlanId("WALLET_CREDIT");
          setSelectedPlan(null);
        } else if (normalized.length > 0) {
          setSelectedPlanId(normalized[0]?.id || "");
          setSelectedPlan(normalized[0] ?? null);
        } else {
          setSelectedPlanId("");
          setSelectedPlan(null);
        }
      } catch (error) {
        logger.error(`Failed to fetch ${activeCategory} plans`, error);
        setBoostPlans([]);
        if (availableCredits > 0) {
          setSelectedPlanId("WALLET_CREDIT");
        } else {
          setSelectedPlanId("");
        }
        setSelectedPlan(null);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    if (open) {
      void fetchBoostPlans();
    }
  }, [open, activeCategory, availableCredits]);

  useEffect(() => {
    if (availableCredits > 0) {
      setSelectedPlanId("WALLET_CREDIT");
      setSelectedPlan(null);
    } else if (boostPlans.length > 0 && selectedPlanId === "WALLET_CREDIT") {
      setSelectedPlanId(boostPlans[0]!.id);
      setSelectedPlan(boostPlans[0]!);
    }
  }, [availableCredits, activeCategory, boostPlans, selectedPlanId]);

  const applyBoost = async (durationDays: number) => {
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

  const handleUseCredits = async () => {
    setIsProcessing(true);
    try {
      const duration =
        selectedPlan?.durationDays || boostPlans[0]?.durationDays || 30;
      const boostApplied = await applyBoost(duration);
      if (!boostApplied) return;

      const promoName =
        activeCategory === "SPOTLIGHT" ? "Spotlight Ad" : "Top Ad";
      notify.success(`${promoName} applied successfully using 1 credit! 🚀`);
      onPlanPurchased?.(promoName, duration);
      onOpenChange(false);
    } catch (error: unknown) {
      notify.error(
        mapErrorToMessage(
          error,
          "Failed to apply promotion. Please check your credit balance."
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    try {
      await startPlanCheckout({
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        description: `${formatPlanName(selectedPlan.name, activeCategory)} (${selectedPlan.durationDays} days)`,
        onCreditPending: () => {
          notify.info("Payment received. Promotion will apply shortly.");
        },
        onPaymentVerified: async () => {
          const boostApplied = await applyBoost(selectedPlan.durationDays);
          if (!boostApplied) return;

          const promoName =
            activeCategory === "SPOTLIGHT" ? "Spotlight Ad" : "Top Ad";
          notify.success(
            `${promoName} purchased and applied successfully! 🚀`
          );
          onPlanPurchased?.(selectedPlan.name, selectedPlan.durationDays);
          onOpenChange(false);
          setSelectedPlan(null);
        },
        onPaymentFailed: (reason: string) => {
          notify.error(`Payment failed: ${reason}`);
        },
      });
    } catch (error) {
      logger.error("Payment error:", error);
    }
  };

  return {
    activeCategory,
    setActiveCategory,
    boostPlans,
    selectedPlanId,
    setSelectedPlanId,
    selectedPlan,
    setSelectedPlan,
    isLoadingPlans,
    isProcessing,
    isWalletCreditSelected: selectedPlanId === "WALLET_CREDIT",
    availableCredits,
    spotlightCredits,
    topAdCredits,
    displayAdTitle,
    handleUseCredits,
    handlePurchase,
  };
}
