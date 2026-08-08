import type { EntitlementType, EntitlementSourceType, EntitlementStatus } from '../../entitlement/schema/entitlement.schema';

export interface CreditPackDTO {
  packId: string;
  entitlementType: EntitlementType;
  totalGranted: number;
  consumed: number;
  remaining: number;
  sourceType: EntitlementSourceType;
  purchaseDate: string;
  expiresAt?: string | null;
  status: EntitlementStatus;
}
