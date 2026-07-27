import { 
  normalizeBusinessStatus,
  isBusinessActiveStatus,
  normalizeAdStatus,
  normalizeServiceStatus,
} from "@esparex/shared";
import type { ServiceStatus, AdStatusValue as AdStatus } from "@esparex/contracts";

export type { ServiceStatus, AdStatus };
export type PartStatus = "pending" | "active" | "inactive" | "rejected" | "expired";
export type TransactionStatus = "INITIATED" | "SUCCESS" | "FAILED";

function normalizeLowercase(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export { 
  normalizeBusinessStatus,
  isBusinessActiveStatus,
  normalizeAdStatus,
  normalizeServiceStatus
};

export function normalizePartStatus(
  value: unknown,
  fallback: PartStatus = "pending"
): PartStatus | "live" {
  return normalizeAdStatus(value, fallback as any) as PartStatus | "live";
}

export function normalizePartCondition(
  value: unknown
): "new" | "used" | "refurbished" {
  const normalized = normalizeLowercase(value);
  if (normalized === "used") return "used";
  if (normalized === "refurbished") return "refurbished";
  return "new";
}

export function normalizeTransactionStatus(
  value: unknown,
  fallback: TransactionStatus = "INITIATED"
): TransactionStatus {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (normalized === "SUCCESS" || normalized === "COMPLETED") return "SUCCESS";
  if (normalized === "FAILED" || normalized === "ERROR") return "FAILED";
  if (normalized === "INITIATED" || normalized === "PENDING") return "INITIATED";
  return fallback;
}
