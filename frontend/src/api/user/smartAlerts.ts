import { API_ROUTES } from "@/api/routes";
import { apiClient } from "@/lib/api/client";
import type { SmartAlert } from "@/hooks/useSmartAlerts";
import type { SmartAlertCreatePayload } from "@shared/schemas/smartAlert.schema";

const normalizeSmartAlert = (raw: unknown): SmartAlert | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? r._id ?? "");
  if (!id) return null;
  return { id, ...r } as SmartAlert;
};

const normalizeSmartAlertList = (raw: unknown): SmartAlert[] => {
  if (Array.isArray(raw)) return raw.map(normalizeSmartAlert).filter(Boolean) as SmartAlert[];
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data.map(normalizeSmartAlert).filter(Boolean) as SmartAlert[];
  }
  return [];
};

export const fetchSmartAlerts = async (): Promise<SmartAlert[]> => {
  const response = await apiClient.get<unknown>(API_ROUTES.USER.SMART_ALERTS);
  return normalizeSmartAlertList(response);
};

export const createSmartAlert = async (
  payload: SmartAlertCreatePayload
): Promise<SmartAlert | null> => {
  const response = await apiClient.post<unknown>(API_ROUTES.USER.SMART_ALERTS, payload);
  const data = (response as Record<string, unknown>)?.data ?? response;
  return normalizeSmartAlert(data);
};

export const updateSmartAlert = async (
  id: string,
  payload: Partial<SmartAlertCreatePayload>
): Promise<SmartAlert | null> => {
  const response = await apiClient.put<unknown>(API_ROUTES.USER.SMART_ALERT_DETAIL(id), payload);
  const data = (response as Record<string, unknown>)?.data ?? response;
  return normalizeSmartAlert(data);
};

export const deleteSmartAlert = async (id: string): Promise<void> => {
  await apiClient.delete(API_ROUTES.USER.SMART_ALERT_DETAIL(id));
};

export const toggleSmartAlertStatus = async (
  smartAlertId: string
): Promise<SmartAlert | null> => {
  const response = await apiClient.patch<unknown>(
    API_ROUTES.USER.SMART_ALERT_TOGGLE_STATUS(smartAlertId)
  );
  const data = (response as Record<string, unknown>)?.data ?? response;
  return normalizeSmartAlert(data);
};
