export interface SubscriptionSummaryDTO {
  planId: string;
  planName: string;
  category: 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  startDate: string;
  endDate?: string | null;
  daysRemaining?: number | null;
  autoRenew?: boolean;
}
