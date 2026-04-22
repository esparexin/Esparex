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
        method: "PUT",
        body: payload,
    });
}
