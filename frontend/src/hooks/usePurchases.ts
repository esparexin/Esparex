import { useState, useEffect, useCallback } from "react";
import { getMyPurchases, type Transaction } from "@/lib/api/user/transactions";
import logger from "@/lib/logger";

export function usePurchases(enabled = true) {
    const [purchaseHistory, setPurchaseHistory] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPurchaseHistory = useCallback(async () => {
        setLoading(true);
        try {
            const history = await getMyPurchases();
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
        if (!enabled) return;
        fetchPurchaseHistory();
    }, [enabled, fetchPurchaseHistory]);

    return {
        purchaseHistory,
        loading,
        error,
        fetchPurchaseHistory,
    };
}
