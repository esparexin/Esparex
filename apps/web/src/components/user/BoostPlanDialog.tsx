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
import { applySpotlightPromotion, applyTopAdPromotion } from "@/lib/api/user/listings";
import { mapErrorToMessage } from "@/lib/errorMapper";
import logger from "@/lib/logger";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { isListingUnavailableError } from "@/lib/listings/listingUnavailable";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { usePlansWalletDashboard } from "@/hooks/usePlansWalletDashboard";

interface BoostPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adId: string | number;
  adTitle: string;
  isSpotlight?: boolean;
  isBoosted?: boolean;
  currentPlan?: string;
  onPlanPurchased?: (planType: string, duration: number) => void;
  onListingUnavailable?: () => void;
}

type PromotionCategory = "SPOTLIGHT" | "BOOST_AD";

type BoostPlan = ApiPlan & {
  durationDays: number;
  displayBoost: string;
};

function formatPlanName(name?: string, category: PromotionCategory = "SPOTLIGHT"): string {
  if (!name || name.toLowerCase().includes("new user plan")) {
    return category === "SPOTLIGHT" ? "Spotlight Featured Boost" : "Top Ad Priority Placement";
  }
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getCreditRemaining(raw: unknown): number {
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
  isSpotlight = false,
  isBoosted = false,
  onPlanPurchased,
  onListingUnavailable,
}: BoostPlanDialogProps) {
  const [activeCategory, setActiveCategory] = useState<PromotionCategory>("SPOTLIGHT");
  const [boostPlans, setBoostPlans] = useState<BoostPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("WALLET_CREDIT");
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const { isProcessing, setIsProcessing, startPlanCheckout } = usePlanCheckout();
  const { benefits } = useUserBenefits();
  const { dashboardData } = usePlansWalletDashboard();

  const spotlightCreditsFromBenefits = getCreditRemaining(benefits?.balances?.spotlightCredits);
  const spotlightCreditsFromWallet = dashboardData?.wallet?.spotlightCredits ?? 0;
  const spotlightCredits = Math.max(spotlightCreditsFromBenefits, spotlightCreditsFromWallet);

  const topAdCreditsFromBenefits = getCreditRemaining(benefits?.balances?.topAdCredits);
  const topAdCreditsFromWallet = dashboardData?.wallet?.topAdCredits ?? 0;
  const topAdCredits = Math.max(topAdCreditsFromBenefits, topAdCreditsFromWallet);

  const availableCredits = activeCategory === "SPOTLIGHT" ? spotlightCredits : topAdCredits;

  // Clean duplicate text in adTitle if present
  const displayAdTitle = String(adTitle || "")
    .split(" with ")[0]
    ?.trim() || "";

  useEffect(() => {
    const fetchBoostPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const plans = await getPlans({ type: activeCategory, userType: "normal" });
        const normalized: BoostPlan[] = plans
          .filter((plan) => plan.type === activeCategory && !plan.isDefault && plan.price > 0)
          .map((plan) => ({
            ...plan,
            durationDays: plan.durationDays || 7,
            displayBoost: `${plan.features?.priorityWeight || 2}x`,
          }));
        setBoostPlans(normalized);
        
        // Select wallet credit card by default if user has available credits, otherwise select first purchase plan
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
      const duration = selectedPlan?.durationDays || boostPlans[0]?.durationDays || 30;
      const boostApplied = await applyBoost(duration);
      if (!boostApplied) return;

      const promoName = activeCategory === "SPOTLIGHT" ? "Spotlight Ad" : "Top Ad";
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

          const promoName = activeCategory === "SPOTLIGHT" ? "Spotlight Ad" : "Top Ad";
          notify.success(`${promoName} purchased and applied successfully! 🚀`);
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

  const isWalletCreditSelected = selectedPlanId === "WALLET_CREDIT";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-white shadow-xl border border-slate-100">
        <DialogHeader className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-amber-600 fill-amber-500" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Promote Listing
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 line-clamp-1">
            Promote &ldquo;{displayAdTitle}&rdquo; for maximum buyer visibility.
          </DialogDescription>
        </DialogHeader>

        {/* Active Spotlight Status View — Replaces purchase UI completely when Spotlight is active */}
        {isSpotlight ? (
          <div className="py-6 px-4 space-y-4 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 border-4 border-amber-200 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-amber-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <Badge className="bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wide">
                ✨ Spotlight Active
              </Badge>
              <h3 className="text-base font-bold text-slate-900 pt-2">
                This listing is in Spotlight!
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Spotlight is the highest promotion tier. Your listing is receiving prioritized top-of-search placement and amber badge highlighting across category feeds.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Window
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Active Top Ad Banner for Upgrade Flow */}
            {isBoosted && activeCategory === "BOOST_AD" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 my-2">
                <Zap className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-900">⚡ Top Ad Currently Active</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    This listing has an active Top Ad promotion. Switch to the Spotlight Ad tab above to upgrade this listing to Spotlight!
                  </p>
                </div>
              </div>
            )}

            {/* Category Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl my-2" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === "SPOTLIGHT"}
                onClick={() => setActiveCategory("SPOTLIGHT")}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeCategory === "SPOTLIGHT"
                    ? "bg-white text-amber-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Spotlight Ad
                {spotlightCredits > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                    {spotlightCredits}
                  </span>
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === "BOOST_AD"}
                onClick={() => setActiveCategory("BOOST_AD")}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeCategory === "BOOST_AD"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                Top Ad
                {topAdCredits > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-extrabold">
                    {topAdCredits}
                  </span>
                )}
              </button>
            </div>

        {isLoadingPlans ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Spinner size="sm" /> Loading options...
          </div>
        ) : (
          <div className="space-y-3.5 my-2">
            {/* 1. Wallet Balance Available Card (Primary Choice when availableCredits > 0) */}
            {availableCredits > 0 && (
              <div
                onClick={() => {
                  setSelectedPlanId("WALLET_CREDIT");
                  setSelectedPlan(null);
                }}
                className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isWalletCreditSelected
                    ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-400/40 shadow-xs"
                    : "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isWalletCreditSelected ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {activeCategory === "SPOTLIGHT" ? <Sparkles className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-emerald-950">
                        {availableCredits} {activeCategory === "SPOTLIGHT" ? "Spotlight" : "Top Ad"} {availableCredits === 1 ? "Credit" : "Credits"} Available
                      </h4>
                      <Badge className="bg-emerald-600 text-white text-2xs px-1.5 py-0 font-bold border-0">
                        Wallet Balance
                      </Badge>
                    </div>
                    <p className="text-tiny text-emerald-800 mt-0.5 font-medium">
                      Apply 1 credit to promote this listing for {selectedPlan?.durationDays || boostPlans[0]?.durationDays || 30} Days
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-emerald-700">
                    FREE
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold">1 Credit</p>
                  {isWalletCreditSelected && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto mt-0.5" />
                  )}
                </div>
              </div>
            )}

            {/* Divider if both wallet balance and catalog plans are present */}
            {availableCredits > 0 && boostPlans.length > 0 && (
              <div className="relative flex items-center justify-center py-1">
                <div className="w-full border-t border-slate-200" />
                <span className="absolute bg-white px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  or Purchase Additional Packs
                </span>
              </div>
            )}

            {/* 2. Catalog Purchase Options */}
            {boostPlans.length > 0 && (
              <div className="grid gap-2.5">
                {boostPlans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const formattedName = formatPlanName(plan.name, activeCategory);

                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setSelectedPlan(plan);
                      }}
                      className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? activeCategory === "SPOTLIGHT"
                            ? "border-amber-400 bg-amber-50/60 ring-2 ring-amber-300/40 shadow-xs"
                            : "border-blue-400 bg-blue-50/60 ring-2 ring-blue-300/40 shadow-xs"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? activeCategory === "SPOTLIGHT" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}>
                          {activeCategory === "SPOTLIGHT" ? <Sparkles className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-800">
                              {formattedName}
                            </h4>
                            <Badge className={`text-2xs px-1.5 py-0 font-semibold border-0 ${
                              activeCategory === "SPOTLIGHT"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {plan.displayBoost} Visibility
                            </Badge>
                          </div>
                          <p className="text-tiny text-slate-500 mt-0.5">
                            {activeCategory === "SPOTLIGHT" ? "Featured" : "Top Placement"} for {plan.durationDays} Days
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900">
                          {plan.price === 0 ? "FREE" : formatPrice(plan.price)}
                        </p>
                        {isSelected && (
                          <CheckCircle2 className={`h-4 w-4 ml-auto mt-0.5 ${
                            activeCategory === "SPOTLIGHT" ? "text-amber-500" : "text-blue-500"
                          }`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Minimal Footer with ONE Single Primary Button */}
        {(() => {
          const isPromotionBlocked = isSpotlight || (isBoosted && activeCategory === "BOOST_AD");
          return (
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={isWalletCreditSelected ? handleUseCredits : handlePurchase}
                disabled={isProcessing || isPromotionBlocked || (!isWalletCreditSelected && !selectedPlan)}
                className={`w-full h-10 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 ${
                  isPromotionBlocked
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : isWalletCreditSelected
                      ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-400"
                      : activeCategory === "SPOTLIGHT"
                        ? "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400"
                        : "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Spinner size="sm" />
                    <span>Applying Promotion...</span>
                  </>
                ) : isSpotlight ? (
                  <span>✨ Spotlight Active (Highest Tier)</span>
                ) : isBoosted && activeCategory === "BOOST_AD" ? (
                  <span>⚡ Top Ad Active (Upgrade to Spotlight Above)</span>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>
                      {isWalletCreditSelected
                        ? `Apply ${activeCategory === "SPOTLIGHT" ? "Spotlight Ad" : "Top Ad"} (Use 1 Credit)`
                        : `Buy & Apply for ${selectedPlan ? formatPrice(selectedPlan.price) : ""}`}
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
          );
        })()}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
