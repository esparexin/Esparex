"use client";

import { useState } from "react";

import { createPurchaseOrder } from "@/lib/api/user/plans";
import { getWalletSummary, type WalletSummary } from "@/lib/api/user/users";
import { loadRazorpay, type RazorpayOptions } from "@/lib/payments/razorpay";
import { waitForWalletCredit } from "@/lib/payments/waitForWalletCredit";

type WalletCreditField = keyof Pick<
  WalletSummary,
  "adCredits" | "spotlightCredits" | "smartAlertSlots"
>;

type WaitForCreditConfig = {
  field: WalletCreditField;
  minimumDelta?: number;
  timeoutMs?: number;
  intervalMs?: number;
};

type StartPlanCheckoutInput = {
  planId: string;
  amount: number;
  currency?: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  waitForCredit?: WaitForCreditConfig;
  onCreditPending?: () => void;
  onPaymentVerified: () => Promise<void> | void;
  onPaymentFailed?: () => void;
  onDismiss?: () => void;
};

export function usePlanCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const startPlanCheckout = async (input: StartPlanCheckoutInput): Promise<void> => {
    const {
      planId,
      amount,
      currency = "INR",
      description,
      prefill,
      waitForCredit,
      onCreditPending,
      onPaymentVerified,
      onPaymentFailed,
      onDismiss,
    } = input;

    setIsProcessing(true);

    try {
      const baselineWallet = waitForCredit ? await getWalletSummary() : null;
      const order = await createPurchaseOrder(planId);
      const loaded = await loadRazorpay();

      if (!loaded || !window.Razorpay) {
        throw new Error("Payment gateway failed to load");
      }

      const options: RazorpayOptions = {
        key: order.keyId,
        amount: Math.round(amount * 100),
        currency: order.currency || currency,
        name: "Esparex",
        description,
        order_id: order.orderId,
        prefill: prefill ?? {
          name: order.userName,
          email: order.userEmail,
          contact: order.userPhone,
        },
        handler: async () => {
          if (waitForCredit) {
            const baseline = baselineWallet?.[waitForCredit.field] ?? 0;
            const wallet = await waitForWalletCredit(
              waitForCredit.field,
              baseline,
              waitForCredit.minimumDelta ?? 1,
              waitForCredit.timeoutMs,
              waitForCredit.intervalMs
            );
            if (!wallet) {
              onCreditPending?.();
              setIsProcessing(false);
              return;
            }
          }

          await onPaymentVerified();
          setIsProcessing(false);
        },
        modal: {
          ondismiss: () => {
            onDismiss?.();
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on?.("payment.failed", () => {
        onPaymentFailed?.();
        setIsProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      onPaymentFailed?.();
      setIsProcessing(false);
      throw error;
    }
  };

  return {
    isProcessing,
    setIsProcessing,
    startPlanCheckout,
  };
}
