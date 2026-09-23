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
  error?: RazorpayErrorDetail;
};

const isPaymentFailedResponse = (value: unknown): value is RazorpayPaymentFailedResponse =>
  typeof value === "object" && value !== undefined;

export interface RazorpayErrorDetail {
  code?: string;
  description?: string;
  reason?: string;
  source?: string;
  step?: string;
}

export function mapRazorpayPaymentFailure(errorDetail?: RazorpayErrorDetail): string {
  if (!errorDetail) {
    return "Payment could not be processed. Please verify your details or try using UPI, Netbanking, or an Indian domestic card.";
  }

  const code = (errorDetail.code || "").toUpperCase();
  const reason = (errorDetail.reason || "").toLowerCase();
  const desc = (errorDetail.description || "").toLowerCase();

  // 1. International Cards / Non-domestic methods
  if (
    reason.includes("international") ||
    desc.includes("international") ||
    desc.includes("foreign") ||
    desc.includes("country not supported") ||
    reason.includes("currency_not_supported")
  ) {
    return "International cards are not supported. Please use an Indian domestic debit/credit card, UPI, or Netbanking.";
  }

  // 2. User cancellation / modal dismiss
  if (
    reason.includes("cancelled") ||
    reason.includes("closed") ||
    desc.includes("cancelled") ||
    desc.includes("closed")
  ) {
    return "Payment process was closed without completing.";
  }

  // 3. Rate limiting / Security checks
  if (
    code.includes("RATE_LIMIT") ||
    reason.includes("rate_limit") ||
    desc.includes("rate limit") ||
    desc.includes("too many")
  ) {
    return "Too many payment attempts detected. Please wait a few moments before trying again.";
  }

  // 4. Bank / Card decline or insufficient funds
  if (
    reason.includes("declined") ||
    desc.includes("declined") ||
    reason.includes("insufficient") ||
    desc.includes("insufficient") ||
    reason.includes("card_limit")
  ) {
    return "Payment was declined by your bank or card issuer. Please check your card balance or try UPI / another card.";
  }

  // 5. OTP / Authentication failure / Timeout
  if (
    reason.includes("auth") ||
    desc.includes("auth") ||
    reason.includes("otp") ||
    desc.includes("otp") ||
    reason.includes("timed_out") ||
    desc.includes("timeout") ||
    desc.includes("timed out")
  ) {
    return "Payment authentication failed or timed out. Please try again.";
  }

  // 6. Payment method temporarily unavailable
  if (
    reason.includes("method_not_available") ||
    desc.includes("temporarily unavailable") ||
    desc.includes("gateway error")
  ) {
    return "The selected payment method is temporarily unavailable. Please try an alternative such as UPI or Netbanking.";
  }

  // 7. General fallback for post-initiation failure
  return "Payment could not be processed. Please verify your details or try using UPI, Netbanking, or an Indian domestic card.";
}

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

        const userFriendlyReason = mapRazorpayPaymentFailure(errorDetail);

        onPaymentFailed?.(userFriendlyReason);
        setIsProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      logger.error("Checkout initialization failed detail", error);
      const userMessage = mapErrorToMessage(error, "Payment couldn't be started right now. Please try again in a few moments.");
      onPaymentFailed?.(userMessage);
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    setIsProcessing,
    startPlanCheckout,
  };
}
