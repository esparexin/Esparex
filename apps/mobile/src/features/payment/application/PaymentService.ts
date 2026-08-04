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

  async processCheckout(planId: string) {
    const order = await this.paymentRepository.createPaymentOrder(planId);

    // Auto-fulfilled zero-cost / mock order
    if (order.status === 'SUCCESS' || order.amount === 0) {
      return {
        razorpay_payment_id: `zero_cost_${order.orderId}`,
        razorpay_order_id: order.orderId,
        razorpay_signature: 'auto_verified',
      };
    }

    // Open Native SDK Checkout
    const result = await this.paymentRepository.openNativeCheckout(order);

    // Verify payment on backend
    await this.paymentRepository.verifyPayment({
      razorpayPaymentId: result.razorpay_payment_id,
      razorpayOrderId: result.razorpay_order_id,
      razorpaySignature: result.razorpay_signature,
    });

    return result;
  }

  async getWalletSummary(): Promise<WalletSummary> {
    return this.paymentRepository.getWalletSummary();
  }

  async getTransactionHistory(): Promise<PaymentTransaction[]> {
    return this.paymentRepository.getTransactionHistory();
  }
}
