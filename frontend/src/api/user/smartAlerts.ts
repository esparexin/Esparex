import { API_ROUTES } from "@/api/routes";
import { apiClient } from "@/lib/api/client";
import type { SmartAlert } from "@/hooks/useSmartAlerts";

export const fetchSmartAlerts = async (): Promise<SmartAlert[]> => {
  const response = await apiClient.get<unknown>(API_ROUTES.USER.SMART_ALERTS);
  // Normalize response if needed
  if (Array.isArray(response)) return response as SmartAlert[];
  if (response && typeof response === "object" && Array.isArray((response as any).data)) {
    return (response as any).data as SmartAlert[];
  }
  return [];
};

export const toggleSmartAlertStatus = async (
  smartAlertId: string
): Promise<SmartAlert | null> => {
  const response = await apiClient.put(
    `${API_ROUTES.USER.SMART_ALERT_DETAIL(smartAlertId)}`,
    { toggleStatus: true }
  );
  return response as SmartAlert;
};
