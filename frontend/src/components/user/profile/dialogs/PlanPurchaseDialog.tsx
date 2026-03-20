"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Crown, CheckCircle2, AlertCircle } from "@/components/ui/icons";
import { notify } from "@/lib/notify";
import logger from "@/lib/logger";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";

type PlanPurchaseItem = {
    id: string;
    name: string;
    type: string;
    features: string[];
    price: number;
};

interface PlanPurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedPlan: string | null;
    plans: PlanPurchaseItem[];
    formatCurrency: (amount: number) => string;
    onConfirm?: () => void;
}

const planTypeToWalletField = (type: string) => {
    if (type === "Spotlight") return "spotlightCredits" as const;
    if (type === "More Ads") return "adCredits" as const;
    return "smartAlertSlots" as const;
};

export function PlanPurchaseDialog({
    open,
    onOpenChange,
    selectedPlan,
    plans,
    formatCurrency,
    onConfirm,
}: PlanPurchaseDialogProps) {
    const { isProcessing, startPlanCheckout } = usePlanCheckout();

    if (!selectedPlan) return null;
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return null;

    const handleConfirm = async () => {
        try {
            await startPlanCheckout({
                planId: plan.id,
                amount: plan.price,
                description: plan.name,
                waitForCredit: {
                    field: planTypeToWalletField(plan.type),
                    minimumDelta: 1,
                },
                onCreditPending: () => {
                    notify.info("Payment received. Credits will appear after verification shortly.");
                    onConfirm?.();
                    onOpenChange(false);
                },
                onPaymentVerified: async () => {
                    notify.success("Plan purchased successfully!");
                    onConfirm?.();
                    onOpenChange(false);
                },
                onPaymentFailed: () => {
                    notify.error("Payment failed. Please try again.");
                },
            });
        } catch (error) {
            logger.error("Plan purchase failed", error);
            notify.error("Failed to start payment. Please try again.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Crown className="h-5 w-5 text-amber-600" />
                        </div>
                        Confirm Purchase
                    </DialogTitle>
                    <DialogDescription>
                        You're about to purchase this plan
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Card className="bg-gray-50">
                        <CardContent className="p-4 space-y-3">
                            <div>
                                <p className="font-semibold">{plan.name}</p>
                                <p className="text-xs text-muted-foreground">{plan.type}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Features:</p>
                                <ul className="space-y-1">
                                    {plan.features.map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">Total Amount:</span>
                                <span className="text-xl font-bold text-green-600">
                                    {formatCurrency(plan.price)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-900">
                            Credits are applied only after Razorpay webhook verification. Frontend checkout success alone does not activate the plan.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold px-8 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? "Processing..." : "Confirm & Pay"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
