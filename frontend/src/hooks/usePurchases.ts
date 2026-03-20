import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/api/routes";
import type { Transaction } from "@/api/user/transactions";
import logger from "@/lib/logger";

export function usePurchases() {
    const [purchaseHistory, setPurchaseHistory] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPurchaseHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<unknown>(API_ROUTES.USER.PURCHASE_HISTORY);
            let history: Transaction[] = [];
            if (Array.isArray(response)) {
                history = response as Transaction[];
            } else if (
                typeof response === "object" &&
                response !== null &&
                Array.isArray((response as { data?: unknown }).data)
            ) {
                history = (response as { data: Transaction[] }).data;
            }

            setPurchaseHistory(history);
            setError(null);
        } catch (err) {
            logger.error("Failed to fetch purchase history:", err);
            setError("Failed to load purchase history");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPurchaseHistory();
    }, [fetchPurchaseHistory]);

    return {
        purchaseHistory,
        loading,
        error,
        fetchPurchaseHistory,
    };
}