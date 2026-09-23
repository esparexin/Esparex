export interface WalletSummaryDTO {
  userId: string;
  monthlyFreeAdsTotal: number;
  monthlyFreeAdsUsed: number;
  monthlyFreeAdsRemaining: number;
  paidAdCredits: number;
  spotlightCredits: number;
  topAdCredits: number;
  /** Total alert slots = freeAlertSlotsBase + paidAlertSlots */
  smartAlertSlots: number;
  /** Base free alert slots from the user's plan (default 2) */
  freeAlertSlotsBase: number;
  /** Purchased extra alert slots on top of the free base */
  paidAlertSlots: number;
  nextMonthlyResetDate?: string | null;
}
