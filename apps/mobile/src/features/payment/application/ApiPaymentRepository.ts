import { Plan } from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { PaymentOrder } from '../domain/PaymentOrder';
import { WalletSummary } from '../domain/WalletSummary';
import { PaymentTransaction } from '../domain/PaymentTransaction';
import { IPaymentRepository } from './IPaymentRepository';
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
