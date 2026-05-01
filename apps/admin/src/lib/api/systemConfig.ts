import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type { SystemConfig, SystemConfigPatch } from "@/types/systemConfig";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export async function getSystemConfig(): Promise<SystemConfig> {
  const response = await adminFetch<unknown>(ADMIN_ROUTES.SYSTEM_CONFIG);
  const root = toRecord(response);
  const data = toRecord(root.data);
  return data as SystemConfig;
}

export async function updateSystemConfig(patch: SystemConfigPatch): Promise<SystemConfig> {
  const response = await adminFetch<unknown>(ADMIN_ROUTES.SYSTEM_CONFIG, {
    method: "PATCH",
    body: patch
  });
  const root = toRecord(response);
  const data = toRecord(root.data);
  return data as SystemConfig;
}

