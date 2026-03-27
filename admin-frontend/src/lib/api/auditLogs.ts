import { adminFetch } from "./adminClient";
import { parseAdminResponse } from "./parseAdminResponse";
import { ADMIN_ROUTES } from "./routes";
import type { AdminLog } from "@/types/audit";

export type PaginatedAuditLogs = {
    items: AdminLog[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
};

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
}: AuditLogQuery): Promise<PaginatedAuditLogs> {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (search.trim()) {
        query.set("search", search.trim());
    }
    if (action !== "all") {
        query.set("action", action);
    }

    const response = await adminFetch<unknown>(`${ADMIN_ROUTES.AUDIT_LOGS}?${query.toString()}`);
    const parsed = parseAdminResponse<AdminLog>(response);
    const pagination = parsed.pagination;

    return {
        items: parsed.items,
        pagination: {
            page: pagination?.page ?? page,
            limit: pagination?.limit ?? limit,
            total: pagination?.total ?? parsed.items.length,
            pages: pagination?.pages ?? pagination?.totalPages ?? 1,
        },
    };
}
