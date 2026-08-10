import { Plan, PlansWalletV1DTO } from '@esparex/contracts';
import { PaymentOrder } from '../domain/PaymentOrder';
import { WalletSummary } from '../domain/WalletSummary';
import { PaymentTransaction } from '../domain/PaymentTransaction';

export interface VerifyPaymentInput {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface PaymentSuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface IPaymentRepository {
  getPlans(): Promise<Plan[]>;
  createPaymentOrder(planId: string): Promise<PaymentOrder>;
  verifyPayment(input: VerifyPaymentInput): Promise<void>;
  openNativeCheckout(order: PaymentOrder): Promise<PaymentSuccessResult>;
  getWalletSummary(): Promise<WalletSummary>;
  getTransactionHistory(): Promise<PaymentTransaction[]>;
  getPlansWalletDashboard(): Promise<PlansWalletV1DTO | null>;
}
