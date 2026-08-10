import type { SubscriptionSummaryDTO } from './SubscriptionSummaryDTO';
import type { WalletSummaryDTO } from './WalletSummaryDTO';
import type { CreditPackDTO } from './CreditPackDTO';
import type { PromotionDTO } from './PromotionDTO';
import type { CreditLedgerDTO } from './CreditLedgerDTO';
import type { PaymentSummaryDTO } from './PaymentSummaryDTO';

export interface PlansWalletV1DTO {
  subscription: SubscriptionSummaryDTO | null;
  wallet: WalletSummaryDTO;
  creditPacks: CreditPackDTO[];
  activePromotions: PromotionDTO[];
  recentUsage: CreditLedgerDTO[];
  recentPayments: PaymentSummaryDTO[];
}
