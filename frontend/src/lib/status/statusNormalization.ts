import { 
  normalizeBusinessStatus as sharedNormalizeBusinessStatus,
  normalizeAdStatus as sharedNormalizeAdStatus,
  normalizeServiceStatus as sharedNormalizeServiceStatus,
  type DomainStatus
} from "@shared/utils/statusNormalization";

export type AdStatus = DomainStatus;
export type ServiceStatus = DomainStatus;
export type PartStatus = "pending" | "active" | "inactive" | "rejected" | "expired";
export type TransactionStatus = "INITIATED" | "SUCCESS" | "FAILED";

function normalizeLowercase(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeBusinessStatus(
  value: unknown,
  fallback: "pending" = "pending"
): "live" | "pending" | "rejected" | "suspended" | "deleted" {
  return sharedNormalizeBusinessStatus(value, fallback);
}

export function normalizeAdStatus(
  value: unknown,
  fallback: "pending" = "pending"
): "live" | "pending" | "sold" | "expired" | "rejected" | "deactivated" {
  return sharedNormalizeAdStatus(value, fallback);
}

export function normalizeServiceStatus(
  value: unknown,
  fallback: "pending" = "pending"
): "live" | "pending" | "expired" | "rejected" | "deactivated" {
  return sharedNormalizeServiceStatus(value, fallback);
}

export function normalizePartStatus(
  value: unknown,
  fallback: PartStatus = "pending"
): PartStatus | "live" {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "approved" || normalized === "active") return "live";
  if (normalized === "pending") return "pending";
  if (normalized === "inactive") return "inactive";
  if (normalized === "rejected") return "rejected";
  if (normalized === "expired") return "expired";
  return fallback;
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
