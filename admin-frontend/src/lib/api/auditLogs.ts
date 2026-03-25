import { adminFetch } from "./adminClient";
import { parseAdminResponse } from "./parseAdminResponse";
import { ADMIN_ROUTES } from "./routes";
import type { AdminLog } from "@/types/audit";

type AuditLogQuery = {
    search: string;
    action: string;
    page?: number;
    limit?: number;
};

export async function fetchAuditLogs({
    search,
    action,
    page = 1,
    limit = 50,
}: AuditLogQuery): Promise<AdminLog[]> {
    const query = new URLSearchParams({
        search,
        action,
        page: String(page),
        limit: String(limit),
    }).toString();

    const response = await adminFetch<unknown>(`${ADMIN_ROUTES.AUDIT_LOGS}?${query}`);
    return parseAdminResponse<AdminLog>(response).items;
}
