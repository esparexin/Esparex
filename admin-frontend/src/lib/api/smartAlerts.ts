import { apiClient } from "@/lib/apiClient";
import type { SmartAlertDeliveryLogDTO } from "@shared/schemas/smartAlert.schema";

interface FetchLogsParams {
    page: number;
    limit: number;
}

interface FetchLogsResponse {
    items: SmartAlertDeliveryLogDTO[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export async function fetchSmartAlertLogs(params: FetchLogsParams): Promise<FetchLogsResponse> {
    return apiClient.get<FetchLogsResponse>("/smart-alerts/logs", { params });
}
