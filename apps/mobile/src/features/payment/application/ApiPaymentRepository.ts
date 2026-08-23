import RazorpayCheckout from 'react-native-razorpay';
import { Plan, PlansWalletV1DTO } from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { PaymentOrder } from '../domain/PaymentOrder';
import { WalletSummary } from '../domain/WalletSummary';
import { PaymentTransaction } from '../domain/PaymentTransaction';
import { IPaymentRepository, VerifyPaymentInput, PaymentSuccessResult } from './IPaymentRepository';
import { CreatePaymentOrderMapper } from './mappers/CreatePaymentOrderMapper';

export class ApiPaymentRepository implements IPaymentRepository {
  async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get<{ data: Plan[] }>('/payments/plans');
    const resData = response.data;
    if (Array.isArray(resData)) return resData;
    return resData?.data || [];
  }

  async createPaymentOrder(planId: string): Promise<PaymentOrder> {
    const payload = CreatePaymentOrderMapper.toPayload(planId);
    const response = await apiClient.post<{ data: PaymentOrder }>('/payments/orders', payload);
    return response.data.data;
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<void> {
    try {
      await apiClient.post('/payments/verify', {
        razorpay_payment_id: input.razorpayPaymentId,
        razorpay_order_id: input.razorpayOrderId,
        razorpay_signature: input.razorpaySignature,
      });
    } catch (error: any) {
      // 🛡️ Webhook-Only Fallback: If backend verify endpoint returns 404 (e.g. server running in webhook-only mode),
      // client payment is confirmed asynchronously via gateway webhook to prevent blocking native UI checkout.
      if (error?.response?.status === 404) {
        return;
      }
      throw error;
    }
  }

  async openNativeCheckout(order: PaymentOrder): Promise<PaymentSuccessResult> {
    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
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
    const response = await apiClient.get<{ data: WalletSummary }>('/payments/credits/wallet');
    return response.data?.data ?? {
      adCredits: 0,
      spotlightCredits: 0,
      smartAlertSlots: 0,
    };
  }

  async getTransactionHistory(): Promise<PaymentTransaction[]> {
    const response = await apiClient.get<{ data: PaymentTransaction[] }>('/payments/history');
    const resData = response.data;
    if (Array.isArray(resData)) return resData;
    return resData?.data || [];
  }

  async getPlansWalletDashboard(): Promise<PlansWalletV1DTO | null> {
    try {
      const res = await apiClient.get<{ success?: boolean; data?: PlansWalletV1DTO }>('/payments/account/plans-wallet');
      if (res.data?.data) {
        return res.data.data;
      }
      return null;
    } catch {
      return null;
    }
  }
}

