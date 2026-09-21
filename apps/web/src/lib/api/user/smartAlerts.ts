import { API_ROUTES } from "@esparex/shared";
import { apiClient } from "@/lib/api/client";
import type { SmartAlert } from "@/hooks/useSmartAlerts";
import type { SmartAlertCreatePayload, SmartAlertQuotaDTO } from "@esparex/contracts";

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

export interface SmartAlertsResponse {
  alerts: SmartAlert[];
  quota: SmartAlertQuotaDTO | null;
}

export const fetchSmartAlerts = async (): Promise<SmartAlert[]> => {
  const response = await apiClient.get<unknown>(API_ROUTES.USER.SMART_ALERTS);
  return normalizeSmartAlertList(response);
};

export const fetchSmartAlertsWithQuota = async (): Promise<SmartAlertsResponse> => {
  const response = await apiClient.get<unknown>(API_ROUTES.USER.SMART_ALERTS);
  const alerts = normalizeSmartAlertList(response);
  const rawObj = response as Record<string, unknown> | null;
  const quota = (rawObj?.quota as SmartAlertQuotaDTO) || null;
  return { alerts, quota };
};

export const fetchSmartAlertQuota = async (): Promise<SmartAlertQuotaDTO | null> => {
  try {
    const response = await apiClient.get<unknown>(`${API_ROUTES.USER.SMART_ALERTS}/quota`);
    const payload = (response as Record<string, unknown>)?.data ?? response;
    return (payload as SmartAlertQuotaDTO) ?? null;
  } catch {
    return null;
  }
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
  const response = await apiClient.patch<unknown>(API_ROUTES.USER.SMART_ALERT_DETAIL(id), payload);
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

export interface FetchSmartAlertMatchesParams {
  page?: number;
  limit?: number;
  alertId?: string;
}

interface SmartAlertMatchRecord {
  id: string;
  alertId: string;
  alertName: string;
  deliveredAt: string | Date;
  isRead: boolean;
  adId: string;
  actionUrl?: string;
  ad?: {
    id: string;
    title: string;
    price: number;
    currency?: string;
    images?: string[];
    status: string;
    location?: {
      city?: string;
      state?: string;
      display?: string;
    };
    seoSlug?: string;
    listingType?: string;
  } | null;
}

interface FetchSmartAlertMatchesResponse {
  matches: SmartAlertMatchRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchSmartAlertMatches = async (
  params: FetchSmartAlertMatchesParams = {}
): Promise<FetchSmartAlertMatchesResponse> => {
  const queryParams: Record<string, string | number> = {};
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.alertId) queryParams.alertId = params.alertId;

  const response = await apiClient.get<FetchSmartAlertMatchesResponse | { data: FetchSmartAlertMatchesResponse }>(
    API_ROUTES.USER.SMART_ALERTS_MATCHES,
    { params: queryParams }
  );
  const payload = response && typeof response === 'object' && 'data' in response && response.data && typeof response.data === 'object' && 'matches' in response.data
    ? (response.data as FetchSmartAlertMatchesResponse)
    : (response as FetchSmartAlertMatchesResponse);

  return {
    matches: Array.isArray(payload?.matches) ? payload.matches : [],
    total: typeof payload?.total === "number" ? payload.total : 0,
    page: typeof payload?.page === "number" ? payload.page : 1,
    limit: typeof payload?.limit === "number" ? payload.limit : 10,
    totalPages: typeof payload?.totalPages === "number" ? payload.totalPages : 1,
  };
};
