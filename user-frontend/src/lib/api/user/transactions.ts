import { apiClient } from "@/lib/api/client";
import { toApiResult } from "@/lib/api/result";
import { normalizeTransactionStatus } from "@/lib/status/statusNormalization";
import { API_ROUTES } from "../routes";

export interface PlanSnapshot {
    code: string;
    name: string;
    type: string;
    credits: number;
    price: number;
    currency: string;
}

export interface Transaction {
    id: string;
    userId: string;
    planId: string;
    planSnapshot: PlanSnapshot;
    paymentGateway?: string;
    gatewayOrderId?: string;
    amount: number;
    currency: string;
    status: "INITIATED" | "SUCCESS" | "FAILED";
    validUntil?: string;

    createdAt: string;
    updatedAt: string;
}

export async function getMyPurchases(): Promise<Transaction[]> {
    const { data: result } = await toApiResult<Transaction[]>(apiClient.get(API_ROUTES.USER.PURCHASE_HISTORY));
    if (!Array.isArray(result)) return [];

    return result.map((transaction) => ({
        ...transaction,
        status: normalizeTransactionStatus(transaction.status),
    }));
}
