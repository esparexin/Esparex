import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type {
  AdCampaignItem,
  MonetizationSystemState,
} from "@esparex/contracts";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export async function getAdminCampaigns(): Promise<AdCampaignItem[]> {
  const response = await adminFetch<unknown>(ADMIN_ROUTES.MONETIZATION_CAMPAIGNS);
  const root = toRecord(response);
  const data = Array.isArray(root.data) ? root.data : [];
  return data as AdCampaignItem[];
}

export async function createAdminCampaign(
  campaign: Partial<AdCampaignItem>
): Promise<AdCampaignItem> {
  const response = await adminFetch<unknown>(ADMIN_ROUTES.MONETIZATION_CAMPAIGNS, {
    method: "POST",
    body: campaign,
  });
  const root = toRecord(response);
  return (root.data || {}) as AdCampaignItem;
}

export async function updateAdminCampaign(
  id: string,
  patch: Partial<AdCampaignItem>
): Promise<AdCampaignItem> {
  const response = await adminFetch<unknown>(ADMIN_ROUTES.MONETIZATION_CAMPAIGN_BY_ID(id), {
    method: "PATCH",
    body: patch,
  });
  const root = toRecord(response);
  return (root.data || {}) as AdCampaignItem;
}

export async function deleteAdminCampaign(id: string): Promise<boolean> {
  const response = await adminFetch<unknown>(ADMIN_ROUTES.MONETIZATION_CAMPAIGN_BY_ID(id), {
    method: "DELETE",
  });
  const root = toRecord(response);
  return Boolean(root.success);
}

export async function getAdminMonetizationConfig(): Promise<MonetizationSystemState> {
  const response = await adminFetch<unknown>(ADMIN_ROUTES.MONETIZATION_CONFIG);
  const root = toRecord(response);
  return (root.data || {
    featureEnabled: true,
    publishingEnabled: true,
    providers: {},
  }) as MonetizationSystemState;
}

export async function updateAdminMonetizationConfig(
  patch: Partial<MonetizationSystemState>
): Promise<MonetizationSystemState> {
  const response = await adminFetch<unknown>(ADMIN_ROUTES.MONETIZATION_CONFIG, {
    method: "PATCH",
    body: patch,
  });
  const root = toRecord(response);
  return (root.data || {}) as MonetizationSystemState;
}
