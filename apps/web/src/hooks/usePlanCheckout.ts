"use client";

import { useState } from "react";

import { createPurchaseOrder, verifyPurchaseOrder } from "@/lib/api/user/plans";
import { getWalletSummary, type WalletSummary } from "@/lib/api/user/users";
import { loadRazorpay, type RazorpayOptions, type RazorpayHandlerResponse } from "@/lib/payments/razorpay";
import { waitForWalletCredit } from "@/lib/payments/waitForWalletCredit";
import logger from "@/lib/logger";
import { mapErrorToMessage } from "@/lib/errorMapper";

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

type RazorpayPaymentFailedResponse = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
  };
};

const isPaymentFailedResponse = (value: unknown): value is RazorpayPaymentFailedResponse =>
  typeof value === "object" && value !== undefined;

type StartPlanCheckoutInput = {
  planId: string;
  amount: number;
  currency?: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  waitForCredit?: WaitForCreditConfig;
  onCreditPending?: () => void;
  onPaymentVerified: () => Promise<void> | void;
  onPaymentFailed?: (reason: string) => void;
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

      // If order is zero-cost (amount === 0) or explicit mock mode enabled, complete checkout immediately
      const isMockOrder = typeof order.orderId === "string" && order.orderId.startsWith("order_mock_");
      const allowMockBypass = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === "true";

      if (amount === 0 || (isMockOrder && allowMockBypass)) {
        await onPaymentVerified();
        setIsProcessing(false);
        return;
      }

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
        handler: async (response: RazorpayHandlerResponse) => {
          try {
            if (response?.razorpay_payment_id && response?.razorpay_order_id && response?.razorpay_signature) {
              await verifyPurchaseOrder({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
            }
          } catch (verifyError) {
            logger.error("Client signature verification failed", verifyError);
          }

          if (waitForCredit) {
            const baseline = baselineWallet?.[waitForCredit.field] ?? 0;
            const wallet = await waitForWalletCredit(
              waitForCredit.field,
              baseline,
              waitForCredit.minimumDelta ?? 1,
              waitForCredit.timeoutMs ?? 15000,
              waitForCredit.intervalMs ?? 1500
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
      razorpay.on?.("payment.failed", (response: unknown) => {
        const errorDetail = isPaymentFailedResponse(response) ? response.error : undefined;
        logger.error("Payment failed detail", errorDetail);

        const userFriendlyReason = (() => {
          const code = (errorDetail?.code || "").toUpperCase();
          const desc = (errorDetail?.description || errorDetail?.reason || "").toLowerCase();
          if (code.includes("RATE_LIMIT") || desc.includes("too many") || desc.includes("rate limit")) {
            return "Too many payment attempts were detected. Please wait a short time and try again.";
          }
          if (desc.includes("cancelled") || desc.includes("closed")) {
            return "Payment process was closed without completing.";
          }
          if (desc.includes("declined") || desc.includes("insufficient")) {
            return "Payment couldn't be processed. Please check your payment details or try a different method.";
          }
          return "Payment couldn't be started right now. Please try again in a few moments.";
        })();

        onPaymentFailed?.(userFriendlyReason);
        setIsProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      logger.error("Checkout initialization failed detail", error);
      const userMessage = mapErrorToMessage(error, "Payment couldn't be started right now. Please try again in a few moments.");
      onPaymentFailed?.(userMessage);
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
