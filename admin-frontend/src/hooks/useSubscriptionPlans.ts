import { useState, useCallback, useEffect } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useToast } from "@/context/ToastContext";
import type { Plan } from "@shared/types/Plan";

export function useSubscriptionPlans() {
    const { showToast } = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMutating, setIsMutating] = useState(false);

    const fetchPlans = useCallback(async (filters: { search?: string; type?: string } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams();
            if (filters.search) query.set("search", filters.search);
            if (filters.type && filters.type !== "all") query.set("type", filters.type);

            const response = await adminFetch<unknown>(`${ADMIN_ROUTES.PLANS}?${query.toString()}`);
            const parsed = parseAdminResponse<Plan>(response);
            setPlans(parsed.items);
            return { success: true, data: parsed.items };
        } catch (err: any) {
            const msg = err.message || "Failed to load plans";
            setError(msg);
            showToast(msg, "error");
            return { success: false, error: msg };
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const handleToggleStatus = async (planId: string) => {
        setIsMutating(true);
        try {
            await adminFetch(ADMIN_ROUTES.PLAN_TOGGLE(planId), {
                method: "PATCH"
            });
            showToast("Plan status updated successfully", "success");
            // Optimistic update would be hard without knowing previous state easily, 
            // so we refresh. More robust for finance.
            await fetchPlans();
            return { success: true };
        } catch (err: any) {
            const msg = err.message || "Failed to toggle plan status";
            showToast(msg, "error");
            return { success: false, error: msg };
        } finally {
            setIsMutating(false);
        }
    };

    return {
        plans,
        loading,
        error,
        isMutating,
        fetchPlans,
        handleToggleStatus
    };
}
