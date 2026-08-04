export interface PaymentOrder {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
  status?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}
