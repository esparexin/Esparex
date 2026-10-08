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
    const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

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

    const runMutation = useCallback(async (action: () => Promise<unknown>, title: string, message: string, failTitle: string) => {
        setIsMutating(true);
        try {
            await action();
            showAdminPopup({ type: "success", title, message });
            await fetchPlans();
            return { success: true };
        } catch (err) {
            const msg = err instanceof Error ? err.message : failTitle;
            showAdminPopup({ type: "error", title: failTitle, message: msg });
            return { success: false, error: msg };
        } finally {
            setIsMutating(false);
        }
    }, [fetchPlans]);

    const handleToggleStatus = useCallback((planId: string) =>
        runMutation(() => adminFetch(ADMIN_ROUTES.PLAN_TOGGLE(planId), { method: "PATCH" }), "Success", "Plan status updated successfully", "Failed to toggle plan status"), [runMutation]);

    const handleArchive = useCallback((planId: string, reason?: string) =>
        runMutation(() => archivePlan(planId, reason), "Plan Archived", "Plan has been archived successfully.", "Archive Failed"), [runMutation]);

    const handleRestore = useCallback((planId: string) =>
        runMutation(() => restorePlan(planId), "Plan Restored", "Plan has been restored to Inactive status.", "Restore Failed"), [runMutation]);

    const onToggleClick = useCallback(async (plan: Plan) => {
        if (plan.active) setTogglingPlanId(plan.id);
        else await handleToggleStatus(plan.id);
    }, [handleToggleStatus]);

    const confirmToggleStatus = useCallback(async () => {
        if (!togglingPlanId) return { success: false };
        const result = await handleToggleStatus(togglingPlanId);
        if (result.success) setTogglingPlanId(null);
        return result;
    }, [handleToggleStatus, togglingPlanId]);

    const cancelToggleStatus = useCallback(() => setTogglingPlanId(null), []);

    return {
        plans,
        loading,
        error,
        isMutating,
        fetchPlans,
        handleToggleStatus,
        handleArchive,
        handleRestore,
        togglingPlanId,
        setTogglingPlanId,
        onToggleClick,
        confirmToggleStatus,
        cancelToggleStatus,
    };
}
