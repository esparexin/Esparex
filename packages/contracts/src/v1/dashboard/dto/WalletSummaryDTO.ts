export interface WalletSummaryDTO {
  userId: string;
  monthlyFreeAdsTotal: number;
  monthlyFreeAdsUsed: number;
  monthlyFreeAdsRemaining: number;
  paidAdCredits: number;
  spotlightCredits: number;
  topAdCredits: number;
  smartAlertSlots: number;
  nextMonthlyResetDate?: string | null;
}
