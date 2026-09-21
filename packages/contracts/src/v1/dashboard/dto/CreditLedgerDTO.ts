import type { EntitlementType } from '../../entitlement/schema/entitlement.schema';

export interface CreditLedgerDTO {
  transactionId: string;
  type: 'CREDIT' | 'DEBIT' | 'EXPIRE' | 'RESET';
  creditPool: 'PROMOTIONAL' | 'MONTHLY_FREE' | 'PURCHASED' | 'SUBSCRIPTION';
  amount: number;
  entitlementType?: EntitlementType;
  reason: string;
  listingId?: string;
  adTitle?: string;
  adSlug?: string;
  adStatus?: 'active' | 'expired' | 'sold' | string;
  adExpiresAt?: string;
  adRemainingDays?: number;
  validityText?: string;
  spotlightExpiresAt?: string;
  spotlightStatus?: 'ACTIVE' | 'EXPIRED';
  createdAt: string;
}
