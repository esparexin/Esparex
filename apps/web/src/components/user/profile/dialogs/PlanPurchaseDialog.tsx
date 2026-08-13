
"use client";

import { useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@esparex/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Crown, AlertCircle } from "@/icons/IconRegistry";
import { PlanFeatureList } from "@/components/user/profile/PlanFeatureList";
import { PlanCheckoutGstSection } from "./PlanCheckoutGstSection";
import { notify } from "@/lib/feedback";
import logger from "@/lib/logger";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { computeInvoiceTax, GSTIN_REGEX } from "@esparex/contracts";

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
    const t = (type || "").toUpperCase();
    if (t.includes("SPOTLIGHT")) return "spotlightCredits" as const;
    if (t.includes("ALERT")) return "smartAlertSlots" as const;
    return "adCredits" as const;
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
    const [wantsGst, setWantsGst] = useState(false);
    const [gstin, setGstin] = useState("");
    const [sendEmailReceipt, setSendEmailReceipt] = useState(true);

    if (!selectedPlan) return null;
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return null;

    const isGstValid = GSTIN_REGEX.test(gstin.trim());
    const taxResult = computeInvoiceTax(plan.price, wantsGst && isGstValid ? gstin.trim() : undefined);

    const handleConfirm = async () => {
        try {
            // Dismiss dialog first to release Radix body scroll locks before Razorpay launches
            onOpenChange(false);
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
                },
                onPaymentVerified: async () => {
                    notify.success("Plan purchased successfully!");
                    onConfirm?.();
                    if (typeof window !== "undefined") {
                        window.location.href = "/account/wallet";
                    }
                },
                onPaymentFailed: (reason: string) => {
                    notify.error(reason);
                },
                onDismiss: () => {
                    notify.info("Payment process was closed.");
                },
            });
        } catch (error) {
            logger.error("Plan purchase failed", error);
            notify.error("Payment couldn't be started right now. Please try again in a few moments.");
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
                        You&apos;re about to purchase this plan
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Card className="bg-gray-50 border-slate-200">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">{plan.name}</p>
                                    <p className="text-xs text-muted-foreground">{plan.type}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${taxResult.invoiceType === 'TAX_INVOICE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                                    {taxResult.invoiceType === 'TAX_INVOICE' ? 'B2B Tax Invoice' : 'Bill of Supply'}
                                </span>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Features:</p>
                                <PlanFeatureList features={plan.features} className="space-y-1" />
                            </div>

                            {/* Send PDF Receipt via Email Toggle */}
                            <div className="flex items-center gap-2 pt-1">
                                <Checkbox
                                    id="checkout-send-email"
                                    checked={sendEmailReceipt}
                                    onCheckedChange={(checked) => setSendEmailReceipt(Boolean(checked))}
                                />
                                <Label htmlFor="checkout-send-email" className="text-xs font-medium text-slate-800 cursor-pointer">
                                    Send PDF Invoice receipt to my email (if configured)
                                </Label>
                            </div>

                            <Separator />

                            {/* B2B GST Tax Credit Accordion */}
                            <PlanCheckoutGstSection
                                wantsGst={wantsGst}
                                onWantsGstChange={setWantsGst}
                                gstin={gstin}
                                onGstinChange={setGstin}
                                isGstValid={isGstValid}
                            />

                            <Separator />

                            {/* Pricing & Tax Breakdown */}
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(taxResult.subtotalAmount)}</span>
                                </div>

                                {taxResult.taxBreakup?.cgstAmount !== undefined && (
                                    <>
                                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                                            <span>CGST (9%):</span>
                                            <span>{formatCurrency(taxResult.taxBreakup.cgstAmount)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                                            <span>SGST (9%):</span>
                                            <span>{formatCurrency(taxResult.taxBreakup.sgstAmount!)}</span>
                                        </div>
                                    </>
                                )}

                                {taxResult.taxBreakup?.igstAmount !== undefined && (
                                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                                        <span>IGST (18%):</span>
                                        <span>{formatCurrency(taxResult.taxBreakup.igstAmount)}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                    <span className="font-bold text-sm text-slate-900">Total Payable:</span>
                                    <span className="text-xl font-bold text-emerald-600">
                                        {formatCurrency(taxResult.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-medium text-blue-900 leading-relaxed">
                            🔒 <strong>Instant Activation</strong> — Your plan credits will be activated immediately upon payment confirmation.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                        Cancel
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold px-8 shadow-lg shadow-blue-200 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
