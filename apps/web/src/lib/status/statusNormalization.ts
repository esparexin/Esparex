import { 
  normalizeBusinessStatus,
  isBusinessActiveStatus,
  normalizeAdStatus,
  normalizeServiceStatus,
  normalizeTransactionStatus,
} from "@esparex/shared";
import type { 
  ServiceStatus, 
  AdStatusValue as AdStatus,
  TransactionStatusValue,
  ListingStatus,
} from "@esparex/contracts";
import { PAYMENT_STATUS } from "@esparex/contracts";

export type { ServiceStatus, AdStatus, TransactionStatusValue, ListingStatus };
/** Canonical transaction lifecycle status (SSOT: @esparex/contracts) */
export type TransactionStatus = TransactionStatusValue;
/** Spare parts use the unified Ad/Listing domain (SSOT: ListingStatus from @esparex/contracts). */
export type PartStatus = "pending" | "active" | "inactive" | "rejected" | "expired";

function normalizeLowercase(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export { 
  normalizeBusinessStatus,
  isBusinessActiveStatus,
  normalizeAdStatus,
  normalizeServiceStatus,
  normalizeTransactionStatus,
  PAYMENT_STATUS
};

export function normalizePartStatus(
  value: unknown,
  fallback: PartStatus = "pending"
): PartStatus | "live" {
  const adFallback = fallback === "active" ? "live" : fallback;
  return normalizeAdStatus(value, adFallback as Parameters<typeof normalizeAdStatus>[1]) as PartStatus | "live";
}

export function normalizePartCondition(
  value: unknown
): "new" | "used" | "refurbished" {
  const normalized = normalizeLowercase(value);
  if (normalized === "used") return "used";
  if (normalized === "refurbished") return "refurbished";
  return "new";
}

