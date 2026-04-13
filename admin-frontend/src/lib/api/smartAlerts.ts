import { adminFetch } from "./adminClient";
import { parseAdminResponse } from "./parseAdminResponse";
import { ADMIN_ROUTES } from "./routes";
import type { SmartAlertDeliveryLogDTO } from "@shared/schemas/smartAlert.schema";

interface FetchLogsParams {
    page: number;
    limit: number;
}

export interface PaginatedSmartAlertLogs {
    items: SmartAlertDeliveryLogDTO[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export async function fetchSmartAlertLogs({
    page = 1,
    limit = 50,
}: FetchLogsParams): Promise<PaginatedSmartAlertLogs> {
    const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    const response = await adminFetch<unknown>(`${ADMIN_ROUTES.SMART_ALERT_LOGS}?${query.toString()}`);
    const parsed = parseAdminResponse<SmartAlertDeliveryLogDTO>(response);
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
