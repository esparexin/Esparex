import { apiClient } from "@/lib/api/client";
import { toApiResult } from "@/lib/api/result";
import { API_ROUTES } from "../routes";
import logger from "@/lib/logger";
import { Plan } from "@esparex/contracts";
export type { Plan };

export interface PlanQuery {
    type?: Plan["type"];
    userType?: "normal" | "business" | "both";
}

/**
 * Get available plans
 */
export async function getPlans(query?: PlanQuery): Promise<Plan[]> {
    try {
        const { data: result } = await toApiResult<Plan[]>(
            apiClient.get(API_ROUTES.USER.PAYMENT_PLANS, {
                params: query
            })
        );

        if (!Array.isArray(result)) {
            throw new Error("Invalid plans response");
        }

        return result;
    } catch (e) {
        logger.error("Failed to load plans", e);
        throw e;
    }
}

/**
 * Create a purchase order for a plan
 */
export interface PurchaseOrder {
    orderId: string;
    transactionId: string;
    amount: number;
    currency: string;
    keyId: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
}

export async function createPurchaseOrder(
    planId: string
): Promise<PurchaseOrder> {
    if (!planId) {
        throw new Error("planId is required");
    }

    try {
        const { data: result } = await toApiResult<PurchaseOrder>(
            apiClient.post(API_ROUTES.USER.PAYMENT_ORDERS, { planId })
        );

        if (!result || !result.orderId || !result.keyId) {
            throw new Error("Failed to create purchase order");
        }

        return result;
    } catch (e) {
        logger.error("Failed to create purchase order", e);
        throw e;
    }
}

/**
 * Verify completed Razorpay payment signature
 */
export interface VerifyPaymentInput {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface VerifyPaymentResult {
    success: boolean;
    message: string;
}

export async function verifyPurchaseOrder(
    input: VerifyPaymentInput
): Promise<VerifyPaymentResult> {
    if (!input.razorpay_payment_id || !input.razorpay_order_id || !input.razorpay_signature) {
        throw new Error("Missing required payment verification fields");
    }

    try {
        const { data: result } = await toApiResult<VerifyPaymentResult>(
            apiClient.post(API_ROUTES.USER.PAYMENT_VERIFY, input)
        );

        return result ?? { success: true, message: "Payment verified successfully" };
    } catch (e) {
        logger.error("Failed to verify payment signature", e);
        throw e;
    }
}

