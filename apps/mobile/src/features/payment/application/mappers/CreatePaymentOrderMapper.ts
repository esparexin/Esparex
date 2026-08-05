export interface CreatePaymentOrderPayload {
  planId: string;
}

export class CreatePaymentOrderMapper {
  static toPayload(planId: string): CreatePaymentOrderPayload {
    if (!planId || typeof planId !== 'string') {
      throw new Error('Invalid planId provided for payment order creation');
    }
    return { planId: planId.trim() };
  }
}
