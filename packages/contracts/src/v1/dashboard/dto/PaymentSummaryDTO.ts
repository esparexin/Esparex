export interface PaymentSummaryDTO {
  orderId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  description: string;
  invoicePdfUrl?: string;
  createdAt: string;
}
