"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Spinner,
  Zap,
  Sparkles,
} from "@esparex/ui";
import { formatPrice } from "@/lib/formatters";
import { useBoostPlanDialog } from "@/hooks/useBoostPlanDialog";
import { WalletCreditCard, CatalogPlanCard, SpotlightActiveNotice, PromotionValidityPreview } from "./boost/BoostPlanCards";

interface BoostPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adId: string | number;
  adTitle: string;
  isSpotlight?: boolean;
  isBoosted?: boolean;
  adExpiresAt?: string | Date;
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
  adExpiresAt,
  onPlanPurchased,
  onListingUnavailable,
}: BoostPlanDialogProps) {
  const {
    activeCategory, setActiveCategory, boostPlans,
    selectedPlanId, setSelectedPlanId, selectedPlan, setSelectedPlan,
    isLoadingPlans, isProcessing, isWalletCreditSelected, availableCredits,
    spotlightCredits, topAdCredits, displayAdTitle, handleUseCredits, handlePurchase,
  } = useBoostPlanDialog({
    open, adId, adTitle, onOpenChange, onPlanPurchased, onListingUnavailable,
  });

  const now = Date.now();
  const adExpMs = adExpiresAt ? new Date(adExpiresAt).getTime() : 0;
  const isAdExpired = adExpMs > 0 && adExpMs <= now;
  const adRemainingDays = adExpMs > 0 ? Math.max(0, Math.ceil((adExpMs - now) / (1000 * 60 * 60 * 24))) : 30;

  const baseDuration = isWalletCreditSelected
    ? 1
    : (selectedPlan?.durationDays || boostPlans[0]?.durationDays || 1);

  const effectiveDurationDays = Math.max(1, Math.min(baseDuration, adRemainingDays));
  const effectiveExpiresAt = new Date(now + effectiveDurationDays * 24 * 60 * 60 * 1000);

  const isPromotionBlocked =
    isSpotlight || (isBoosted && activeCategory === "BOOST_AD");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-card shadow-xl border border-border">
        <DialogHeader className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-warning fill-warning" />
            </div>
            <DialogTitle className="text-body-lg font-bold text-foreground">
              Promote Listing
            </DialogTitle>
          </div>
          <DialogDescription className="text-caption text-foreground-subtle line-clamp-1">
            Promote &ldquo;{displayAdTitle}&rdquo; for maximum buyer visibility.
          </DialogDescription>
        </DialogHeader>

        {isSpotlight ? (
          <SpotlightActiveNotice onClose={() => onOpenChange(false)} />
        ) : (
          <>
            {isBoosted && activeCategory === "BOOST_AD" && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2.5 my-2">
                <Zap className="h-4 w-4 text-link shrink-0 mt-0.5" />
                <div>
                  <p className="text-caption font-bold text-link-dark">⚡ Top Ad Currently Active</p>
                  <p className="text-tiny text-link mt-0.5">
                    This listing has an active Top Ad promotion. Switch to the
                    Spotlight Ad tab above to upgrade this listing to Spotlight!
                  </p>
                </div>
              </div>
            )}

            <div
              className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl my-2"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === "SPOTLIGHT"}
                onClick={() => setActiveCategory("SPOTLIGHT")}
                className={`py-2 px-3 text-caption font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeCategory === "SPOTLIGHT"
                    ? "bg-card text-warning shadow-xs"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Spotlight Ad
                {spotlightCredits > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-tiny bg-warning text-primary-foreground font-extrabold">
                    {spotlightCredits}
                  </span>
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === "BOOST_AD"}
                onClick={() => setActiveCategory("BOOST_AD")}
                className={`py-2 px-3 text-caption font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeCategory === "BOOST_AD"
                    ? "bg-card text-link shadow-xs"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                Top Ad
                {topAdCredits > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-tiny bg-link text-primary-foreground font-extrabold">
                    {topAdCredits}
                  </span>
                )}
              </button>
            </div>

            {isLoadingPlans ? (
              <div className="py-8 text-center text-caption text-foreground-subtle flex items-center justify-center gap-2">
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
                    durationDays={effectiveDurationDays}
                    onSelect={() => {
                      setSelectedPlanId("WALLET_CREDIT");
                      setSelectedPlan(null);
                    }}
                  />
                )}

                {availableCredits > 0 && boostPlans.length > 0 && (
                  <div className="relative flex items-center justify-center py-1">
                    <div className="w-full border-t border-border" />
                    <span className="absolute bg-card px-2 text-tiny uppercase font-bold text-foreground-subtle tracking-wider">
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

                {/* Pre-Confirmation Validity Disclosure */}
                <PromotionValidityPreview
                  adRemainingDays={adRemainingDays}
                  effectiveDurationDays={effectiveDurationDays}
                  effectiveExpiresAt={effectiveExpiresAt}
                  isSpotlight={activeCategory === "SPOTLIGHT"}
                  isAdExpired={isAdExpired}
                />
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={isWalletCreditSelected ? handleUseCredits : handlePurchase}
                disabled={
                  isProcessing ||
                  isPromotionBlocked ||
                  isAdExpired ||
                  (!isWalletCreditSelected && !selectedPlan)
                }
                className={`w-full h-10 text-primary-foreground font-semibold text-caption rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 ${
                  isPromotionBlocked || isAdExpired
                    ? "bg-muted text-foreground-subtle cursor-not-allowed"
                    : activeCategory === "SPOTLIGHT"
                    ? "bg-warning hover:bg-warning/90 focus-visible:ring-warning"
                    : "bg-link hover:bg-link/90 focus-visible:ring-link"
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
                className="w-full text-center text-caption font-medium text-foreground-subtle hover:text-foreground transition-colors py-1 cursor-pointer"
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
