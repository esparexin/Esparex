"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Spinner,
} from "@esparex/ui";
import { Badge } from "../ui/badge";
import {
  Zap,
  Sparkles,
  CheckCircle2,
} from "@/icons/IconRegistry";
import { formatPrice } from "@/lib/formatters";
import { notify } from "@/lib/feedback";
import { getPlans, type Plan as ApiPlan } from "@/lib/api/user/plans";
import { applySpotlightPromotion } from "@/lib/api/user/listings";
import { mapErrorToMessage } from "@/lib/errorMapper";
import logger from "@/lib/logger";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { isListingUnavailableError } from "@/lib/listings/listingUnavailable";
import { useUserBenefits } from "@/hooks/useUserBenefits";

interface BoostPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adId: string | number;
  adTitle: string;
  currentPlan?: string;
  onPlanPurchased?: (planType: string, duration: number) => void;
  onListingUnavailable?: () => void;
}

type BoostPlan = ApiPlan & {
  durationDays: number;
  displayBoost: string;
};

function formatPlanName(name?: string): string {
  if (!name) return "Spotlight Plan";
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getSpotlightRemaining(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (raw && typeof raw === "object" && "remaining" in raw && typeof (raw as { remaining: number }).remaining === "number") {
    return (raw as { remaining: number }).remaining;
  }
  return 0;
}

export function BoostPlanDialog({
  open,
  onOpenChange,
  adId,
  adTitle = "",
  onPlanPurchased,
  onListingUnavailable,
}: BoostPlanDialogProps) {
  const [boostPlans, setBoostPlans] = useState<BoostPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const { isProcessing, setIsProcessing, startPlanCheckout } = usePlanCheckout();
  const { benefits } = useUserBenefits();

  const spotlightCredits = getSpotlightRemaining(benefits?.balances?.spotlightCredits);

  // Clean duplicate text in adTitle if present
  const displayAdTitle = String(adTitle || "")
    .split(" with ")[0]
    ?.trim() || "";

  useEffect(() => {
    const fetchBoostPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const plans = await getPlans({ type: "SPOTLIGHT", userType: "normal" });
        const normalized: BoostPlan[] = plans
          .filter((plan) => plan.type === "SPOTLIGHT")
          .map((plan) => ({
            ...plan,
            durationDays: plan.durationDays || 7,
            displayBoost: `${plan.features?.priorityWeight || 2}x`,
          }));
        setBoostPlans(normalized);
        if (normalized.length > 0) {
          setSelectedPlan(normalized[0] ?? null);
        }
      } catch (error) {
        logger.error("Failed to fetch boost plans", error);
        setBoostPlans([]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    if (open) {
      void fetchBoostPlans();
    }
  }, [open]);

  const applyBoost = async (durationDays: number) => {
    try {
      await applySpotlightPromotion(adId, durationDays);
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

  const handleUseCreditsOrFree = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);

    try {
      const boostApplied = await applyBoost(selectedPlan.durationDays);
      if (!boostApplied) return;

      notify.success("Spotlight Boost applied successfully! 🚀");
      onPlanPurchased?.(selectedPlan.name, selectedPlan.durationDays);
      onOpenChange(false);
    } catch (error: unknown) {
      notify.error(
        mapErrorToMessage(
          error,
          "Failed to apply boost. Please check your credit balance."
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
        description: `${formatPlanName(selectedPlan.name)} (${selectedPlan.durationDays} days)`,
        onCreditPending: () => {
          notify.info("Payment received. Boost will apply shortly.");
        },
        onPaymentVerified: async () => {
          const boostApplied = await applyBoost(selectedPlan.durationDays);
          if (!boostApplied) return;

          notify.success("Boost purchased and applied successfully! 🚀");
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

  const isFreeOrHasCredits = (selectedPlan?.price === 0) || spotlightCredits > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-white shadow-xl border border-slate-100">
        <DialogHeader className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-amber-600 fill-amber-500" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Spotlight Boost
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 line-clamp-1">
            Boost &ldquo;{displayAdTitle}&rdquo; to the top of buyer search results.
          </DialogDescription>
        </DialogHeader>

        {isLoadingPlans ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Spinner size="sm" /> Loading options...
          </div>
        ) : (
          <div className="space-y-4 my-2">
            {/* Plan Options Grid */}
            <div className="grid gap-2.5">
              {boostPlans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const formattedName = formatPlanName(plan.name);

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "border-amber-400 bg-amber-50/60 shadow-xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-600"
                      }`}>
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800">
                            {formattedName}
                          </h4>
                          <Badge className="bg-amber-100 text-amber-800 text-2xs px-1.5 py-0 font-semibold border-0">
                            {plan.displayBoost} Visibility
                          </Badge>
                        </div>
                        <p className="text-tiny text-slate-500 mt-0.5">
                          Featured for {plan.durationDays} Days
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">
                        {plan.price === 0 ? "FREE" : formatPrice(plan.price)}
                      </p>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-amber-500 ml-auto mt-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Wallet Info Badge */}
            {spotlightCredits > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/60 text-xs text-emerald-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Available Wallet Balance:
                </span>
                <span className="font-bold text-emerald-700">{spotlightCredits} Spotlight Credits</span>
              </div>
            )}
          </div>
        )}

        {/* Minimal Footer with ONE Single Primary Button */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={isFreeOrHasCredits ? handleUseCreditsOrFree : handlePurchase}
            disabled={isProcessing || !selectedPlan}
            className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" />
                <span>Applying Boost...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>
                  {isFreeOrHasCredits
                    ? "Apply Spotlight Boost"
                    : `Boost for ${selectedPlan ? formatPrice(selectedPlan.price) : ""}`}
                </span>
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors py-1 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
