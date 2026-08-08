import RazorpayCheckout from 'react-native-razorpay';
import { Plan } from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { PaymentOrder } from '../domain/PaymentOrder';
import { WalletSummary } from '../domain/WalletSummary';
import { PaymentTransaction } from '../domain/PaymentTransaction';
import { IPaymentRepository, VerifyPaymentInput, PaymentSuccessResult } from './IPaymentRepository';
import { CreatePaymentOrderMapper } from './mappers/CreatePaymentOrderMapper';

export class ApiPaymentRepository implements IPaymentRepository {
  async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get<{ data: Plan[] }>('/v1/payments/plans');
    const resData = response.data;
    if (Array.isArray(resData)) return resData;
    return resData?.data || [];
  }

  async createPaymentOrder(planId: string): Promise<PaymentOrder> {
    const payload = CreatePaymentOrderMapper.toPayload(planId);
    const response = await apiClient.post<{ data: PaymentOrder }>('/v1/payments/orders', payload);
    const resData = response.data;
    return resData?.data || (resData as unknown as PaymentOrder);
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<void> {
    try {
      await apiClient.post('/v1/payments/verify', {
        razorpay_payment_id: input.razorpayPaymentId,
        razorpay_order_id: input.razorpayOrderId,
        razorpay_signature: input.razorpaySignature,
      });
    } catch (error: any) {
      // If server operates in webhook-only mode (404 for verify endpoint), don't fail client
      if (error?.response?.status === 404) {
        return;
      }
      throw error;
    }
  }

  async openNativeCheckout(order: PaymentOrder): Promise<PaymentSuccessResult> {
    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
      console.warn('RazorpayCheckout native module is not available in current runtime environment.');
      throw new Error('Native payment gateway is not available on this device platform. Please use Web or supported build.');
    }

    const options = {
      description: 'Ad Credits Package',
      currency: order.currency || 'INR',
      key: order.keyId || 'rzp_test_placeholder',
      amount: Math.round(order.amount * 100),
      name: 'Esparex',
      order_id: order.orderId,
      prefill: {
        email: order.userEmail || '',
        contact: order.userPhone || '',
        name: order.userName || 'Esparex User',
      },
      theme: { color: '#2563eb' },
    };

    try {
      const data = await RazorpayCheckout.open(options);
      return {
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id || order.orderId,
        razorpay_signature: data.razorpay_signature || '',
      };
    } catch (error: any) {
      const code = error?.code;
      const description = error?.description || 'Payment failed or was cancelled';
      if (code === 0) {
        throw new Error('Payment was cancelled by user');
      }
      throw new Error(description);
    }
  }

  async getWalletSummary(): Promise<WalletSummary> {
    const response = await apiClient.get<{ data: WalletSummary }>('/v1/payments/credits/wallet');
    const resData = response.data;
    return (
      resData?.data ||
      (resData as unknown as WalletSummary) || {
        adCredits: 0,
        spotlightCredits: 0,
        smartAlertSlots: 0,
      }
    );
  }

  async getTransactionHistory(): Promise<PaymentTransaction[]> {
    const response = await apiClient.get<{ data: PaymentTransaction[] }>('/v1/payments/history');
    const resData = response.data;
    if (Array.isArray(resData)) return resData;
    return resData?.data || [];
  }
}
