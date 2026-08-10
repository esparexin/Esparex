import type { EntitlementType } from '../../entitlement/schema/entitlement.schema';

export interface CreditLedgerDTO {
  transactionId: string;
  type: 'CREDIT' | 'DEBIT' | 'EXPIRE' | 'RESET';
  creditPool: 'PROMOTIONAL' | 'MONTHLY_FREE' | 'PURCHASED' | 'SUBSCRIPTION';
  amount: number;
  entitlementType?: EntitlementType;
  reason: string;
  listingId?: string;
  createdAt: string;
}
