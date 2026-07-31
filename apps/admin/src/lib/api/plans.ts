import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";

export async function createPlan(payload: Record<string, unknown>) {
    return adminFetch(ADMIN_ROUTES.PLANS, {
        method: "POST",
        body: payload,
    });
}

export async function updatePlan(planId: string, payload: Record<string, unknown>) {
    return adminFetch(ADMIN_ROUTES.PLAN_BY_ID(planId), {
        method: "PATCH",
        body: payload,
    });
}

export async function archivePlan(planId: string, reason?: string) {
    return adminFetch(ADMIN_ROUTES.PLAN_ARCHIVE(planId), {
        method: "POST",
        body: { reason },
    });
}

export async function restorePlan(planId: string) {
    return adminFetch(ADMIN_ROUTES.PLAN_RESTORE(planId), {
        method: "POST",
    });
}
