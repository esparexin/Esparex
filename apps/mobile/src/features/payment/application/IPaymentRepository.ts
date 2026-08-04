import { Plan } from '@esparex/contracts';
import { PaymentOrder } from '../domain/PaymentOrder';
import { WalletSummary } from '../domain/WalletSummary';
import { PaymentTransaction } from '../domain/PaymentTransaction';

export interface IPaymentRepository {
  getPlans(): Promise<Plan[]>;
  createPaymentOrder(planId: string): Promise<PaymentOrder>;
  getWalletSummary(): Promise<WalletSummary>;
  getTransactionHistory(): Promise<PaymentTransaction[]>;
}
