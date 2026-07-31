import { useState, useCallback } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import { Plan } from "@esparex/contracts";
import { archivePlan, restorePlan } from "@/lib/api/plans";

export function useSubscriptionPlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMutating, setIsMutating] = useState(false);

    const fetchPlans = useCallback(async (filters: { q?: string; type?: string; userType?: string } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams();
            if (filters.q) query.set("q", filters.q);
            if (filters.type && filters.type !== "all") query.set("type", filters.type);
            if (filters.userType) query.set("userType", filters.userType);

            const response = await adminFetch<unknown>(`${ADMIN_ROUTES.PLANS}?${query.toString()}`);

            const parsed = parseAdminResponse<Plan>(response);
            setPlans(parsed.items);
            return { success: true, data: parsed.items };
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to load plans";
            setError(msg);
            showAdminPopup({ type: "error", title: "Error", message: msg });
            return { success: false, error: msg };
        } finally {
            setLoading(false);
        }
    }, []);

    const handleToggleStatus = async (planId: string) => {
        setIsMutating(true);
        try {
            await adminFetch(ADMIN_ROUTES.PLAN_TOGGLE(planId), {
                method: "PATCH"
            });
            showAdminPopup({ type: "success", title: "Success", message: "Plan status updated successfully" });
            await fetchPlans();
            return { success: true };
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to toggle plan status";
            showAdminPopup({ type: "error", title: "Error", message: msg });
            return { success: false, error: msg };
        } finally {
            setIsMutating(false);
        }
    };

    const handleArchive = async (planId: string, reason?: string) => {
        setIsMutating(true);
        try {
            await archivePlan(planId, reason);
            showAdminPopup({ type: "success", title: "Plan Archived", message: "Plan has been archived successfully." });
            await fetchPlans();
            return { success: true };
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to archive plan";
            showAdminPopup({ type: "error", title: "Archive Failed", message: msg });
            return { success: false, error: msg };
        } finally {
            setIsMutating(false);
        }
    };

    const handleRestore = async (planId: string) => {
        setIsMutating(true);
        try {
            await restorePlan(planId);
            showAdminPopup({ type: "success", title: "Plan Restored", message: "Plan has been restored to Inactive status." });
            await fetchPlans();
            return { success: true };
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to restore plan";
            showAdminPopup({ type: "error", title: "Restore Failed", message: msg });
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
        handleToggleStatus,
        handleArchive,
        handleRestore,
    };
}
