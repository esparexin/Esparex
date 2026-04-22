import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { AdReportPayload } from "@/lib/listings/adReportPayload";

export async function submitAdReport(payload: AdReportPayload): Promise<void> {
    await apiClient.post(API_ROUTES.USER.REPORTS, payload, {
        silent: true,
    });
}
