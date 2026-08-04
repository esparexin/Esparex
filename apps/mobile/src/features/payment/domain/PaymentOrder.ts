export interface PaymentOrder {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}
