"use client";

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
import { Zap, Sparkles } from "@/icons/IconRegistry";
import { formatPrice } from "@/lib/formatters";
import { useBoostPlanDialog } from "@/hooks/useBoostPlanDialog";
import { WalletCreditCard, CatalogPlanCard } from "./boost/BoostPlanCards";

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
  const {
    activeCategory,
    setActiveCategory,
    boostPlans,
    selectedPlanId,
    setSelectedPlanId,
    selectedPlan,
    setSelectedPlan,
    isLoadingPlans,
    isProcessing,
    isWalletCreditSelected,
    availableCredits,
    spotlightCredits,
    topAdCredits,
    displayAdTitle,
    handleUseCredits,
    handlePurchase,
  } = useBoostPlanDialog({
    open,
    adId,
    adTitle,
    onOpenChange,
    onPlanPurchased,
    onListingUnavailable,
  });

  const isPromotionBlocked =
    isSpotlight || (isBoosted && activeCategory === "BOOST_AD");

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

        {isSpotlight ? (
          <div className="py-6 px-4 space-y-4 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 border-4 border-amber-200 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-amber-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <Badge className="bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wide">
                Spotlight Active
              </Badge>
              <h3 className="text-base font-bold text-slate-900 pt-2">
                This listing is in Spotlight!
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Spotlight is the highest promotion tier. Your listing is receiving
                prioritized top-of-search placement and amber badge highlighting
                across category feeds.
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
            {isBoosted && activeCategory === "BOOST_AD" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 my-2">
                <Zap className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-900">⚡ Top Ad Currently Active</p>
                  <p className="text-tiny text-blue-700 mt-0.5">
                    This listing has an active Top Ad promotion. Switch to the
                    Spotlight Ad tab above to upgrade this listing to Spotlight!
                  </p>
                </div>
              </div>
            )}

            <div
              className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl my-2"
              role="tablist"
            >
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
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-tiny bg-amber-500 text-white font-extrabold">
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
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-tiny bg-blue-600 text-white font-extrabold">
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
                {availableCredits > 0 && (
                  <WalletCreditCard
                    activeCategory={activeCategory}
                    availableCredits={availableCredits}
                    selectedPlan={selectedPlan}
                    boostPlans={boostPlans}
                    isSelected={isWalletCreditSelected}
                    onSelect={() => {
                      setSelectedPlanId("WALLET_CREDIT");
                      setSelectedPlan(null);
                    }}
                  />
                )}

                {availableCredits > 0 && boostPlans.length > 0 && (
                  <div className="relative flex items-center justify-center py-1">
                    <div className="w-full border-t border-slate-200" />
                    <span className="absolute bg-white px-2 text-tiny uppercase font-bold text-slate-400 tracking-wider">
                      or Purchase Additional Packs
                    </span>
                  </div>
                )}

                {boostPlans.length > 0 && (
                  <div className="grid gap-2.5">
                    {boostPlans.map((plan) => (
                      <CatalogPlanCard
                        key={plan.id}
                        plan={plan}
                        activeCategory={activeCategory}
                        isSelected={selectedPlanId === plan.id}
                        onSelect={() => {
                          setSelectedPlanId(plan.id);
                          setSelectedPlan(plan);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={isWalletCreditSelected ? handleUseCredits : handlePurchase}
                disabled={
                  isProcessing ||
                  isPromotionBlocked ||
                  (!isWalletCreditSelected && !selectedPlan)
                }
                className={`w-full h-10 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 ${
                  isPromotionBlocked
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
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
                  <span>Spotlight Active (Highest Tier)</span>
                ) : isBoosted && activeCategory === "BOOST_AD" ? (
                  <span>⚡ Top Ad Active (Upgrade to Spotlight Above)</span>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>
                      {isWalletCreditSelected
                        ? `Apply ${
                            activeCategory === "SPOTLIGHT"
                              ? "Spotlight Ad"
                              : "Top Ad"
                          } (Use 1 Credit)`
                        : `Buy & Apply for ${
                            selectedPlan ? formatPrice(selectedPlan.price) : ""
                          }`}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
