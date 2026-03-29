"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Card, CardContent } from "../ui/card";
import {
  Zap,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { notify } from "@/lib/notify";
import { getPlans, type Plan as ApiPlan } from "@/lib/api/user/plans";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { mapErrorToMessage } from "@/lib/errorMapper";
import logger from "@/lib/logger";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { isListingUnavailableError } from "@/lib/listings/listingUnavailable";
import { getPrimaryPlanCreditCount } from "@shared/utils/planEntitlements";

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

const getBoostVisuals = () => ({
  icon: <Sparkles className="h-6 w-6" />,
  color: "text-yellow-600",
  bgColor: "bg-yellow-50",
  borderColor: "border-yellow-300",
  btnColor: "bg-yellow-600 hover:bg-yellow-700"
});

export function BoostPlanDialog({
  open,
  onOpenChange,
  adId,
  adTitle,
  currentPlan = "Free",
  onPlanPurchased,
  onListingUnavailable,
}: BoostPlanDialogProps) {
  const [boostPlans, setBoostPlans] = useState<BoostPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const { isProcessing, setIsProcessing, startPlanCheckout } = usePlanCheckout();

  useEffect(() => {
    const fetchBoostPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const plans = await getPlans({ type: "SPOTLIGHT", userType: "normal" });
        const normalized = plans
          .filter((plan) => plan.type === "SPOTLIGHT")
          .map((plan) => ({
            ...plan,
            durationDays: plan.durationDays || 7,
            displayBoost: `${plan.features?.priorityWeight || 2}x`,
          }));
        setBoostPlans(normalized);
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
      await apiClient.post(
        API_ROUTES.USER.LISTING_PROMOTE(String(adId)),
        {
          days: durationDays,
          type: "spotlight_hp",
        },
        { silent: true }
      );
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

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    try {
      await startPlanCheckout({
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        description: `${selectedPlan.name} (${selectedPlan.durationDays} days)`,
        waitForCredit: {
          field: "spotlightCredits",
          minimumDelta: Math.max(1, getPrimaryPlanCreditCount(selectedPlan)),
        },
        onCreditPending: () => {
          notify.info("Payment received. Spotlight credits will appear after verification shortly.");
        },
        onPaymentVerified: async () => {
          const boostApplied = await applyBoost(selectedPlan.durationDays);
          if (!boostApplied) return;

          notify.success("Boost purchased and applied successfully! 🚀");
          onPlanPurchased?.(selectedPlan.name, selectedPlan.durationDays);
          onOpenChange(false);
          setSelectedPlan(null);
        },
        onPaymentFailed: () => {
          notify.error("Payment failed. Please try again.");
        },
      });
    } catch (error) {
      logger.error("Payment error:", error);
    }
  };

  const handleUseCredits = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);

    try {
      const boostApplied = await applyBoost(selectedPlan.durationDays);
      if (!boostApplied) return;

      notify.success("Boost applied successfully using wallet credits! 🚀");
      onPlanPurchased?.(selectedPlan.name, selectedPlan.durationDays);
      onOpenChange(false);
    } catch (error: unknown) {
      notify.error(
        mapErrorToMessage(
          error,
          "Failed to apply boost. Check your spotlight credit balance."
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const visuals = getBoostVisuals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-6 w-6 text-green-600" />
            Boost Your Ad
          </DialogTitle>
          <DialogDescription>
            Choose a spotlight plan to boost "{adTitle}" and get more visibility
            {currentPlan !== "Free" && (
              <Badge className="ml-2 bg-green-100 text-green-700">
                Current: {currentPlan}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Choose Your Spotlight Plan
          </h3>
          {isLoadingPlans ? (
            <div className="text-center py-12">Loading boost plans...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {boostPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${visuals.borderColor} border-2 ${selectedPlan?.id === plan.id ? "scale-105 shadow-lg" : "hover:scale-105"}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent className={`p-4 ${visuals.bgColor}`}>
                    <div className="text-center mb-4">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${visuals.bgColor} border-2 ${visuals.borderColor} mb-3`}
                      >
                        <div className={visuals.color}>{visuals.icon}</div>
                      </div>
                      <h4 className="font-bold text-lg mb-1">{plan.name}</h4>
                      <Badge className={`${visuals.bgColor} ${visuals.color} border ${visuals.borderColor}`}>
                        {plan.displayBoost} More Visibility
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      {[(plan.description || plan.name)].map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${visuals.color}`} />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatPrice(plan.price)}</p>
                      <p className="text-xs text-muted-foreground">
                        for {plan.durationDays} days
                      </p>
                    </div>

                    {selectedPlan?.id === plan.id && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 className="h-5 w-5" /> Selected
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedPlan && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" /> Order Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-semibold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-semibold">{selectedPlan.durationDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated lift:</span>
                    <span className="font-semibold flex items-center gap-1"><Eye className="h-4 w-4" /> {selectedPlan.displayBoost}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-lg text-green-600">{formatPrice(selectedPlan.price)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Credits granted on purchase:</span>
                    <span>{getPrimaryPlanCreditCount(selectedPlan)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Applies after webhook verification:</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Yes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={handleUseCredits}
            disabled={isProcessing || !selectedPlan}
          >
            <Zap className="h-4 w-4" />
            Use Wallet Credits
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 gap-2"
            onClick={handlePurchase}
            disabled={isProcessing || !selectedPlan}
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Purchase {selectedPlan ? formatPrice(selectedPlan.price) : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
