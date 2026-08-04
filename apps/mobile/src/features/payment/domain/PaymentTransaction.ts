export interface PaymentTransaction {
  id: string;
  orderId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}
