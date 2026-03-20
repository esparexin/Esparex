import { BUSINESS_STATUS, BusinessStatusValue } from '@shared/enums/businessStatus';

/**
 * Legacy compatibility:
 * historical records may still contain "active" or "approved".
 * Canonical published state is "live".
 */
export const normalizeBusinessStatus = (status: unknown): BusinessStatusValue | 'none' => {
  if (typeof status !== "string") return "none";
  const normalized = status.toLowerCase();
  if (normalized === "active" || normalized === "approved") return BUSINESS_STATUS.LIVE;
  
  const validStatuses: string[] = Object.values(BUSINESS_STATUS);
  if (validStatuses.includes(normalized)) {
    return normalized as BusinessStatusValue;
  }
  return "none";
};

export const isBusinessPublishedStatus = (status: unknown): boolean =>
  normalizeBusinessStatus(status) === BUSINESS_STATUS.LIVE;

/**
 * Canonical published-status query.
 */
export const publishedBusinessStatusQuery = BUSINESS_STATUS.LIVE;
