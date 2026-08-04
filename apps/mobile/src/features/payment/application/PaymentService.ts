import { Plan } from '@esparex/contracts';
import { PaymentOrder } from '../domain/PaymentOrder';
import { WalletSummary } from '../domain/WalletSummary';
import { PaymentTransaction } from '../domain/PaymentTransaction';
import { IPaymentRepository } from './IPaymentRepository';

export class PaymentService {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async getPlans(): Promise<Plan[]> {
    return this.paymentRepository.getPlans();
  }

  async createPaymentOrder(planId: string): Promise<PaymentOrder> {
    return this.paymentRepository.createPaymentOrder(planId);
  }

  async getWalletSummary(): Promise<WalletSummary> {
    return this.paymentRepository.getWalletSummary();
  }

  async getTransactionHistory(): Promise<PaymentTransaction[]> {
    return this.paymentRepository.getTransactionHistory();
  }
}
